import { isQuestionVisible } from "@/features/experience/types/question";
import type { Answers, Question } from "@/features/experience/types/question";

// A conditional belongs to its parent's visual step, never a separate stop.
export function getQuestionSteps(questions: readonly Question[], answers: Answers): Question[][] {
  function withChildren(parent: Question): Question[] {
    return [parent, ...questions
      .filter((question) => (question.sameStepAs ?? question.condition?.questionId) === parent.id && isQuestionVisible(question, answers))
      .flatMap(withChildren)];
  }
  return questions.filter((question) => !question.condition && !question.sameStepAs).map(withChildren);
}
