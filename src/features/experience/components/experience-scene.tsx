import { SecuritySceneOverlay } from "./security-scene-overlay";
import { useScenePrefetch } from "./use-scene-prefetch";
import { ExperienceQuestionCards } from "./experience-question-cards";
import { DesignAestheticOverlay } from "./design-aesthetic-overlay";
import { DesignSceneImage } from "./design-scene-image";
import { DesignFinishHotspots } from "./design-finish-hotspots";
import { finishImageForAnswer, finishQuestionId } from "../config/design-finishes";
import { designImageForAnswer } from "../config/design-images";
import { designEffect, designModes } from "../config/design-effects";
import designStyles from "./design-aesthetic.module.css";
import { securityEffect, securityModes } from "../config/security-effects";
import { useState } from "react";
import { ThermalPreferenceControl } from "./thermal-preference-control";
import thermalStyles from "./thermal-preference.module.css";
import { thermalEffect, thermalTone } from "../config/thermal-effects";
import styles from "./floating-interaction.module.css";
import type { ReactNode } from "react";
import Image from "next/image";
import type { ExperienceSceneConfig } from "@/features/experience/types/experience";
import type { Answers, AnswerValue, Question, QuestionId } from "@/features/experience/types/question";
import { QuestionRenderer } from "@/features/experience/components/question-renderer";

interface ExperienceSceneProps {
  extraContent?: ReactNode;
  scene: ExperienceSceneConfig;
  groupId: string;
  groupProgress: ReactNode;
  questionProgress?: { current: number; total: number };
  navigation: ReactNode;
  questions: readonly Question[];
  answers: Answers;
  onAnswerChange: (id: QuestionId, value: AnswerValue) => void;
}

export function ExperienceScene({ scene, questions, answers, onAnswerChange, groupId, groupProgress, questionProgress, navigation, extraContent }: ExperienceSceneProps) {
  useScenePrefetch(scene.id);
  const immersive = scene.visualVariant === "immersive";
  const normalizedCards = scene.id === "sala" || scene.id === "salida" ||
    (scene.id === "diseno" && ["uv", "funcionalidad"].includes(questions[0]?.id));
  const finishQuestion = scene.id === "diseno" ? questions.find((question) => question.id === finishQuestionId && question.type === "single-choice") : undefined;
  const designMoment = scene.id === designEffect.sceneId && questions[0]?.id === designEffect.primaryId;
  const designVisible = designMoment && questions.some((question) => question.id === designEffect.questionId);
  const activeDesignModes = designVisible
    ? designModes(answers[designEffect.questionId]) : [];
  const floatingInteraction = immersive && (scene.id === "habitacion" || designMoment) && questions[0]?.type === "scale" ? questions[0] : undefined;
  const securityVisible = scene.id === securityEffect.sceneId && questions.some((question) => question.id === securityEffect.questionId);
  const activeSecurityModes = securityVisible ? securityModes(answers[securityEffect.questionId]) : [];
  const thermalQuestion = scene.id === thermalEffect.sceneId ? questions.find((question) => question.id === thermalEffect.questionId) : undefined;
  const [thermalPreview, setThermalPreview] = useState<{ answer: AnswerValue; tone: number }>();
  const thermalAnswer = answers[thermalEffect.questionId];
  const tone = scene.id === thermalEffect.sceneId
    ? thermalPreview && thermalPreview.answer === thermalAnswer
      ? thermalPreview.tone : thermalTone(thermalAnswer)
    : 0;
  return (
    <section aria-labelledby={immersive ? undefined : "scene-title"} aria-label={immersive ? scene.title : undefined} className={floatingInteraction || finishQuestion ? "relative min-h-0 flex-1 overflow-hidden" : immersive ? "relative flex min-h-0 flex-1 items-end justify-center overflow-hidden px-3 pt-16 pb-2.5 sm:px-6 sm:pb-4 lg:px-10" : "relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,3fr)] gap-3 overflow-hidden px-3 pb-3 sm:px-6 sm:pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:grid-rows-1 lg:gap-10 lg:px-10 lg:py-8"}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[#343b37]">
        {scene.backgroundImage ? (
          <div className={immersive ? "relative h-full w-full" : "relative h-[40%] w-full lg:h-full"}>
            {scene.id === designEffect.sceneId ? <DesignSceneImage
              activeImageSrc={finishQuestion ? finishImageForAnswer(answers[finishQuestionId]) : designImageForAnswer(answers[designEffect.questionId], designVisible)}
            /> : <Image
              src={scene.backgroundImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />}
          </div>
        ) : (
          <>
            <div className="absolute inset-y-0 left-[12%] w-px bg-white/10" />
            <div className="absolute inset-y-0 left-[54%] w-px bg-white/10" />
            <div className="absolute inset-x-0 top-[62%] h-px bg-white/10" />
          </>
        )}
      </div>
      {scene.id === thermalEffect.sceneId && <div aria-hidden="true" className={`-z-10 ${thermalStyles.overlay}`}
        style={{ backgroundColor: tone < 0 ? `rgba(65, 145, 235, ${Math.abs(tone) * 0.7})` : `rgba(245, 165, 65, ${tone * 0.4})` }} />}
      {activeSecurityModes.map((mode) => <SecuritySceneOverlay key={mode} mode={mode} />)}
      {activeDesignModes.map((mode) => <DesignAestheticOverlay key={mode} mode={mode} />)}
      {!immersive && <div className="flex min-h-0 min-w-0 flex-col justify-center px-2 lg:justify-end lg:pb-8">
        <div className={scene.backgroundImage ? "w-fit max-w-full rounded-sm bg-stone-950/70 px-3 py-2 lg:p-4" : undefined}>
        <h1 id="scene-title" className="text-lg font-normal tracking-wide sm:text-xl lg:max-w-sm lg:text-2xl">
          {scene.title}
        </h1>
        {scene.description && <p className="mt-2 hidden max-w-sm text-sm leading-relaxed text-stone-300 lg:block">{scene.description}</p>}
        {!scene.backgroundImage && <p className="mt-2 text-xs text-stone-300 lg:mt-6">{scene.visualPlaceholder}</p>}
        </div>
      </div>}
      {normalizedCards ? <ExperienceQuestionCards key={groupId} questions={questions} answers={answers}
        onChange={onAnswerChange} navigation={navigation} progress={questionProgress} extraContent={extraContent}
        anchor={scene.id === "sala" || scene.id === "salida" ? "left" : "right"} /> : finishQuestion?.type === "single-choice" ? <DesignFinishHotspots question={finishQuestion}
        value={answers[finishQuestionId]} onChange={(value) => onAnswerChange(finishQuestionId, value)}
        progress={questionProgress} navigation={navigation}>
        {questions.filter((question) => question.id !== finishQuestionId).map((question) => <QuestionRenderer
          key={question.id} question={question} value={answers[question.id]} variant={scene.visualVariant} layout="dock"
          onChange={(value) => onAnswerChange(question.id, value)} />)}
      </DesignFinishHotspots> : <div className={floatingInteraction ? (designMoment ? designStyles.cards : styles.cards) : "contents"}>
      <div className={floatingInteraction ? `${styles.card} ${designMoment ? designStyles.main : ""}` : immersive ? `flex w-full max-w-5xl min-w-0 flex-wrap items-end gap-x-7 gap-y-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-lg border border-white/10 bg-[#202321]/70 text-stone-100 shadow-md backdrop-blur-sm [color-scheme:dark]` : "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-sm border border-white/30 bg-[#f5f3ee]/98 text-stone-800 shadow-xl [color-scheme:light]"}>
        {floatingInteraction && <svg aria-hidden="true" focusable="false" viewBox="0 0 200 80" preserveAspectRatio="none"
          className="pointer-events-none absolute top-12 right-full h-12 w-5 overflow-visible text-stone-100/65 sm:h-16 sm:w-16 lg:h-20 lg:w-[18vw]">
          <path d="M200 4 H145 L8 68" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <circle cx="8" cy="68" r="3" fill="currentColor" />
        </svg>}
        <div className={immersive ? "flex w-full shrink-0 items-center gap-2 text-stone-300 sm:w-auto sm:min-w-16 sm:self-start sm:pt-1" : "flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-stone-300/70 px-5 py-3 sm:px-6"}>
          {!immersive && <p aria-live="polite" aria-atomic="true" className="text-xs font-medium tracking-wide">{groupProgress}</p>}
          {questionProgress && <p aria-live="polite" aria-atomic="true" className={floatingInteraction ? "text-[10px] text-stone-300/80" : "text-xs text-stone-300"}><span className="sr-only">Pregunta {questionProgress.current} de {questionProgress.total}</span><span aria-hidden="true" className="tracking-widest tabular-nums">{String(questionProgress.current).padStart(2, "0")} / {String(questionProgress.total).padStart(2, "0")}</span></p>}
          <p className={immersive ? "sr-only" : "text-xs text-stone-600"}>* Campo obligatorio.</p>
        </div>
        <div key={groupId} className={floatingInteraction ? "min-h-0 min-w-0 space-y-4 overflow-y-auto overscroll-contain p-1 wrap-anywhere [&_legend]:text-xs [&_label]:text-xs" : immersive ? `min-w-0 basis-full space-y-3 wrap-anywhere sm:flex-1 sm:basis-72 ${questions[0]?.type === "scale" ? "max-h-[calc(100dvh-14rem)] overflow-y-auto overscroll-contain p-1" : ""}` : "min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 wrap-anywhere sm:px-6"}>
          {(floatingInteraction ? questions.slice(0, 1) : questions).map((question) => (
            <QuestionRenderer key={question.id} question={question} value={answers[question.id]} variant={scene.visualVariant} layout={immersive ? "dock" : undefined} refinedScale={question.id === floatingInteraction?.id}
              onChange={(value) => onAnswerChange(question.id, value)} />
          ))}
        </div>
        <div className={floatingInteraction ? "w-full shrink-0 border-t border-white/10 pt-2 pb-[env(safe-area-inset-bottom)] [&_button]:px-3 [&_button]:text-xs [&_nav]:justify-between" : immersive ? "ml-auto w-full shrink-0 pb-[env(safe-area-inset-bottom)] sm:w-auto" : "shrink-0 border-t border-stone-300/70 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"}>
          {navigation}
        </div>
      </div>
      {floatingInteraction && questions.length > 1 && <div className={`${styles.card} ${styles.dependent} ${designMoment ? `${designStyles.secondary} ${designStyles.choices}` : ""}`}>
        {questions.slice(1).map((question) => (
          question.id === thermalQuestion?.id && question.type === "multi-choice" ?
          <ThermalPreferenceControl key={question.id} question={question} value={answers[question.id]}
            order={thermalEffect.positions.map((position) => position.optionValue)} position={tone}
            onChange={(value, position) => {
              setThermalPreview({ answer: value, tone: position });
              onAnswerChange(question.id, value);
            }} /> :
          <QuestionRenderer key={question.id} question={question} value={answers[question.id]}
            variant={scene.visualVariant} layout="dock"
            onChange={(value) => onAnswerChange(question.id, value)} />
        ))}
      </div>}
      </div>}
    </section>
  );
}
