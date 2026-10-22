export type QuestionId = string;
export type AnswerValue = string | number | string[];
export type Answers = Partial<Record<QuestionId, AnswerValue>>;

export type QuestionCondition =
  | { questionId: QuestionId; operator: "equals"; value: string }
  | { questionId: QuestionId; operator: "at-least"; value: number };

export interface QuestionOption {
  label: string;
  value: string;
  description?: string;
  exclusive?: boolean;
}

interface QuestionBase {
  id: QuestionId;
  sceneId: string;
  order: number;
  text: string;
  required: boolean;
  description?: string;
  placeholder?: string;
  condition?: QuestionCondition;
  clearWhenHidden?: boolean;
  sameStepAs?: QuestionId;
}

export type Question = QuestionBase & (
  | { type: "text" | "tel" | "textarea" }
  | { type: "single-choice"; options: readonly QuestionOption[] }
  | { type: "multi-choice"; options: readonly QuestionOption[]; maxSelections?: number }
  | { type: "scale"; min: number; max: number; minLabel: string; maxLabel: string }
);

export function isQuestionVisible(question: Question, answers: Answers): boolean {
  const condition = question.condition;
  if (!condition) return true;
  const value = answers[condition.questionId];
  return condition.operator === "equals"
    ? value === condition.value
    : typeof value === "number" && value >= condition.value;
}

export function isAnswerValid(question: Question, value: AnswerValue | undefined): boolean {
  const empty = value === undefined || (typeof value === "string" && !value.trim()) ||
    (Array.isArray(value) && value.length === 0);
  if (empty) return !question.required;
  switch (question.type) {
    case "text":
    case "tel":
    case "textarea":
      return typeof value === "string";
    case "single-choice":
      return question.options.some((option) => option.value === value);
    case "multi-choice":
      return Array.isArray(value) && new Set(value).size === value.length &&
        value.length <= (question.maxSelections ?? Infinity) &&
        value.every((item) => question.options.some((option) => option.value === item)) &&
        (value.length <= 1 || !question.options.some((option) => option.exclusive && value.includes(option.value)));
    case "scale":
      return typeof value === "number" && Number.isInteger(value) && value >= question.min && value <= question.max;
  }
}
