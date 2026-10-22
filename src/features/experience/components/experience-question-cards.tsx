import type { ReactNode } from "react";
import type { Answers, AnswerValue, Question } from "../types/question";
import { QuestionRenderer } from "./question-renderer";
import styles from "./experience-cards.module.css";

interface Props {
  questions: readonly Question[];
  answers: Answers;
  onChange: (id: string, value: AnswerValue) => void;
  navigation: ReactNode;
  progress?: { current: number; total: number };
  anchor: "left" | "right";
  extraContent?: ReactNode;
}

export function ExperienceQuestionCards({ questions, answers, onChange, navigation, progress, anchor, extraContent }: Props) {
  const [primary, ...dependents] = questions;
  if (!primary) return null;
  const inline = dependents.filter((question) => question.type === "text");
  const secondary = dependents.filter((question) => question.type !== "text");
  const many = primary.type === "multi-choice" && primary.options.length > 4;
  const wide = primary.type === "textarea" || (primary.type === "single-choice" && primary.options.some((option) => option.label.length > 90));
  const render = (question: Question) => <QuestionRenderer key={question.id} question={question} value={answers[question.id]}
    variant="immersive" layout="dock" refinedScale={question.type === "scale"} onChange={(value) => onChange(question.id, value)} />;
  return <div data-card-composition className={`${styles.composition} ${anchor === "left" ? styles.left : ""} ${many ? styles.expandedDock : ""}`}>
    <div data-question-panel className={`${styles.card} ${styles.primary} ${wide ? styles.wide : ""}`}>
      {progress && <p className={styles.progress} aria-live="polite">{String(progress.current).padStart(2, "0")} / {String(progress.total).padStart(2, "0")}</p>}
      <div data-question-body className={styles.body}>
        {render(primary)}
        {inline.map(render)}
        {extraContent}
      </div>
      <div data-question-nav className={styles.navigation}>{navigation}</div>
    </div>
    {secondary.length > 0 && <div data-dependent-panel className={`${styles.card} ${styles.secondary}`}>{secondary.map(render)}</div>}
  </div>;
}
