"use client";

import responsive from "./experience-responsive.module.css";
import { useRef, useState } from "react";
import { buildExperienceSubmission, ExperienceSubmissionError } from "../submission/build-experience-submission";
import { createExperienceSubmissionId, type ExperienceSubmissionDraft } from "../submission/experience-submission";
import { submitExperience, ExperienceSubmitError } from "../submission/submit-experience";
import { ProjectDocuments } from "./project-documents";
import cardStyles from "./experience-cards.module.css";
import { useQuestionAudioEffect } from "@/features/experience/audio/use-question-audio-effect";
import { ExperienceAudioProvider, ExperienceAudioControl } from "@/features/experience/audio/audio-provider";
import { ExperienceScene } from "@/features/experience/components/experience-scene";
import { scenes } from "@/features/experience/config/scenes";
import { questions } from "@/features/experience/config/questions";
import { questionGroups } from "@/features/experience/config/question-groups";
import { getQuestionSteps } from "@/features/experience/utils/question-steps";
import { isAnswerValid, isQuestionVisible } from "@/features/experience/types/question";
import type { Answers, AnswerValue, QuestionId } from "@/features/experience/types/question";

const orderedScenes = [...scenes].sort((a, b) => a.order - b.order);
const questionsById = new Map(questions.map((question) => [question.id, question]));

function getSceneGroups(sceneId: string) {
  return questionGroups.filter((group) => group.sceneId === sceneId)
    .sort((a, b) => a.order - b.order);
}

const buttonClassName =
  "min-h-11 rounded-sm px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 disabled:cursor-not-allowed disabled:opacity-40";

export function ExperienceFlow() {
  return <ExperienceAudioProvider><ExperienceFlowContent /></ExperienceAudioProvider>;
}

function ExperienceFlowContent() {
  const [currentGroupId, setCurrentGroupId] = useState(getSceneGroups(orderedScenes[0].id)[0].id);
  const [answers, setAnswers] = useState<Answers>({});
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [submissionState, setSubmissionState] = useState<"IDLE" | "SUBMITTING" | "SUCCESS" | "ERROR">("IDLE");
  const [submissionError, setSubmissionError] = useState("");
  const submissionDraft = useRef<ExperienceSubmissionDraft | null>(null);
  const submitting = useRef(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const currentGroup = questionGroups.find((group) => group.id === currentGroupId)!;
  const currentIndex = orderedScenes.findIndex(
    (scene) => scene.id === currentGroup.sceneId,
  );
  const currentScene = orderedScenes[currentIndex];
  const immersive = currentScene.visualVariant === "immersive";
  const singleQuestion = currentScene.questionPresentation === "single" || currentGroup.id === "finish-protection";
  const previousScene = orderedScenes[currentIndex - 1];
  const nextScene = orderedScenes.find(
    (scene) => scene.id === currentScene.nextSceneId,
  );
  const sceneGroups = getSceneGroups(currentScene.id);
  const currentGroupIndex = sceneGroups.findIndex((group) => group.id === currentGroupId);
  const previousSceneGroups = previousScene ? getSceneGroups(previousScene.id) : [];
  const previousGroup = sceneGroups[currentGroupIndex - 1]
    ?? previousSceneGroups[previousSceneGroups.length - 1];
  const nextGroup = sceneGroups[currentGroupIndex + 1]
    ?? (nextScene ? getSceneGroups(nextScene.id)[0] : undefined);
  const groupQuestions = currentGroup.questionIds
    .map((id) => questionsById.get(id)!)
    .filter((question) => isQuestionVisible(question, answers));
  const questionSteps = getQuestionSteps(currentGroup.questionIds.map((id) => questionsById.get(id)!), answers);
  const sceneProgress = singleQuestion && currentScene.questionProgressScope === "scene";
  const stepCounts = sceneProgress ? sceneGroups.map((group) =>
    getQuestionSteps(group.questionIds.map((id) => questionsById.get(id)!), answers).length) : [];
  const questionProgress = {
    current: activeQuestionIndex + 1 + stepCounts.slice(0, currentGroupIndex).reduce((sum, count) => sum + count, 0),
    total: sceneProgress ? stepCounts.reduce((sum, count) => sum + count, 0) : questionSteps.length,
  };
  const visibleQuestions = singleQuestion ? questionSteps[activeQuestionIndex] : groupQuestions;
  const activeQuestion = singleQuestion ? visibleQuestions[0] : undefined;
  useQuestionAudioEffect(activeQuestion?.id, activeQuestion ? answers[activeQuestion.id] : undefined);
  const hasPreviousQuestion = singleQuestion && activeQuestionIndex > 0;
  const hasNextQuestion = singleQuestion && activeQuestionIndex < questionSteps.length - 1;
  const canAdvance = visibleQuestions.every((question) => isAnswerValid(question, answers[question.id]))
    && (!visibleQuestions.some((question) => question.id === "project_documents") || projectFiles.length > 0);

  function goBack() {
    if (hasPreviousQuestion) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    } else if (previousGroup) {
      const targetScene = orderedScenes.find((scene) => scene.id === previousGroup.sceneId)!;
      const targetSteps = getQuestionSteps(previousGroup.questionIds.map((id) => questionsById.get(id)!), answers);
      setActiveQuestionIndex(targetScene.questionPresentation === "single" || previousGroup.id === "finish-protection" ? targetSteps.length - 1 : 0);
      setCurrentGroupId(previousGroup.id);
    }
  }

  function goForward() {
    if (!canAdvance) return;
    if (hasNextQuestion) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    } else if (nextGroup) {
      setActiveQuestionIndex(0);
      setCurrentGroupId(nextGroup.id);
    }
  }

  function handleAnswerChange(id: QuestionId, value: AnswerValue) {
    setAnswers((previous) => {
      const updated = { ...previous, [id]: value };
      for (const question of questions) {
        if (question.clearWhenHidden && !isQuestionVisible(question, updated)) {
          delete updated[question.id];
        }
      }
      return updated;
    });
  }

  async function sendProject() {
    if (submitting.current || submissionState === "SUCCESS" || projectFiles.length === 0) return;
    submitting.current = true;
    setSubmissionState("SUBMITTING");
    try {
      // Retain the exact payload and File objects after an uncertain network outcome.
      submissionDraft.current ??= buildExperienceSubmission({
        submissionId: createExperienceSubmissionId(), answers, files: projectFiles,
      });
      await submitExperience(submissionDraft.current);
      setSubmissionState("SUCCESS");
    } catch (error) {
      setSubmissionError(error instanceof ExperienceSubmitError ? error.message
        : error instanceof ExperienceSubmissionError ? "Revisa las respuestas obligatorias y los documentos antes de enviar tu proyecto."
        : "No fue posible enviar tu proyecto. Inténtalo nuevamente.");
      setSubmissionState("ERROR");
    } finally {
      submitting.current = false;
    }
  }

  if (submissionState !== "IDLE") {
    return <main lang="es" className="flex min-h-dvh flex-col bg-[#343b37] px-6 py-8 font-sans text-stone-100 sm:px-12">
      <header className="text-sm">Steel &amp; Glass</header>
      <section aria-live="polite" aria-atomic="true" aria-busy={submissionState === "SUBMITTING"} className="mx-auto my-auto w-full max-w-xl py-16">
        <h1 className="text-2xl font-medium sm:text-3xl">{submissionState === "SUCCESS" ? "¡Hemos recibido tu proyecto!" : submissionState === "SUBMITTING" ? "Enviando tu proyecto..." : "No fue posible enviar tu proyecto"}</h1>
        {submissionState === "SUCCESS" ? <>
          <p className="mt-6 text-base leading-relaxed text-stone-200">Gracias por compartir la información y los documentos con Steel &amp; Glass. Nuestro equipo continuará con la revisión de tu proyecto.</p>
          <p className="mt-4 text-sm leading-relaxed text-stone-300">Nos pondremos en contacto contigo para continuar el proceso.</p>
        </> : submissionState === "ERROR" ? <>
          <p role="alert" className="mt-6 text-sm leading-relaxed text-stone-200">{submissionError}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={sendProject} className={`${buttonClassName} bg-stone-100 text-stone-900`}>Reintentar</button>
            <button type="button" onClick={() => { submissionDraft.current = null; setSubmissionState("IDLE"); }} className={`${buttonClassName} border border-white/30`}>Editar y preparar un nuevo envío</button>
          </div>
        </> : <p className="mt-6 text-sm text-stone-200">Estamos enviando la información y tus documentos.</p>}
      </section>
    </main>;
  }

  return (
    <main lang="es" className={`${responsive.viewport} ${cardStyles.system} ${immersive ? "relative " : ""}isolate flex h-dvh w-full flex-col overflow-hidden bg-[#343b37] font-sans text-stone-100`}>
      <header className={immersive ? "absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-5 py-3 text-shadow-sm text-shadow-black sm:px-8 lg:px-10" : "z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-white/15 px-5 py-4 sm:px-8 lg:px-10"}>
        <p className={immersive ? "text-sm font-normal tracking-[0.12em]" : "text-base font-medium tracking-wide"}>Steel &amp; Glass</p>
        <p aria-live="polite" aria-atomic="true" className="text-xs tracking-wide text-stone-200">
          <span className={immersive ? "sr-only" : undefined}>Paso {currentIndex + 1} de {orderedScenes.length}</span>
          {immersive && <span aria-hidden="true" className="font-light tracking-[0.2em] tabular-nums">{String(currentIndex + 1).padStart(2, "0")} / {String(orderedScenes.length).padStart(2, "0")}</span>}
          {immersive && <span aria-hidden="true" className="mt-2 block h-px w-24 bg-white/30"><span className="block h-px bg-white" style={{ width: `${((currentIndex + 1) / orderedScenes.length) * 100}%` }} /></span>}
        </p>
        <ExperienceAudioControl />
      </header>
      <ExperienceScene
        scene={currentScene}
        extraContent={activeQuestion?.id === "project_documents" ? <ProjectDocuments files={projectFiles} onChange={setProjectFiles} /> : undefined}
        questions={visibleQuestions}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        groupId={singleQuestion ? `${currentGroupId}-${activeQuestionIndex}` : currentGroupId}
        questionProgress={currentScene.id === "diseno" ? { current: currentGroupIndex + 1, total: sceneGroups.length } : singleQuestion ? questionProgress : undefined}
        groupProgress={immersive ? <><span className="sr-only">Sección {currentGroupIndex + 1} de {sceneGroups.length}</span><span aria-hidden="true" className="font-light tracking-[0.18em] tabular-nums">{String(currentGroupIndex + 1).padStart(2, "0")} / {String(sceneGroups.length).padStart(2, "0")}</span></> : `Sección ${currentGroupIndex + 1} de ${sceneGroups.length}`}
        navigation={
          <>
            {!immersive && !canAdvance && <p className={immersive ? "mb-3 text-xs leading-relaxed text-stone-300" : "mb-3 text-xs leading-relaxed text-stone-600"} role="status">Completa las preguntas obligatorias visibles{nextGroup ? " para continuar" : ""}.</p>}
      <nav aria-label="Navegación del recorrido" className={immersive ? "flex flex-wrap items-center justify-end gap-2" : "flex flex-wrap items-center justify-between gap-3"}>
        {(!immersive || hasPreviousQuestion || previousGroup) && <button
          type="button"
          className={`${buttonClassName} ${immersive ? "rounded-md text-stone-200 enabled:hover:bg-white/10 focus-visible:outline-stone-100" : "border border-stone-300 text-stone-700 enabled:hover:bg-stone-200"}`}
          disabled={!hasPreviousQuestion && !previousGroup}
          onClick={goBack}
        >
          {immersive && <span aria-hidden="true">← </span>}Anterior
        </button>}
        {activeQuestion?.id !== "project_documents" && <button
          type="button"
          className={`${immersive ? "min-h-10 rounded-sm border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-stone-50 enabled:hover:border-white/45 enabled:hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-100 disabled:cursor-not-allowed disabled:opacity-40" : `${buttonClassName} bg-stone-800 text-stone-50 enabled:hover:bg-stone-700`}`}
          disabled={(!hasNextQuestion && !nextGroup) || !canAdvance}
          onClick={goForward}
        >
          Continuar{immersive && <span aria-hidden="true"> →</span>}
        </button>}
        {activeQuestion?.id === "project_documents" && <button type="button" disabled={!canAdvance}
          onClick={sendProject} className={`${buttonClassName} bg-stone-800 text-stone-50 enabled:hover:bg-stone-700`}>Enviar proyecto</button>}
      </nav>
          </>
        }
      />
    </main>
  );
}
