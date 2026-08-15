export type ReviewGrade = "again" | "hard" | "good" | "easy";
export type CardStatus = "active" | "learned" | "suspended";

export interface ReviewQueueItem {
  cardId: string;
  currentBox: number;
  isFlagged: boolean;
  frontHtml: string;
  backHtml: string;
  /** متن خام (بدون HTML) فیلد اصلی — برای تلفظ صوتی با Web Speech API */
  frontRawText: string;
}

export interface SubmitReviewResult {
  cardId: string;
  boxBefore: number;
  boxAfter: number;
  newStatus: CardStatus;
  nextReviewAt: Date;
}

export interface BoxSummaryItem {
  boxNumber: number;
  wordCount: number;
  intervalLabel: string;
}
