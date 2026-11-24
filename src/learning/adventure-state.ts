/** Zapisany stan przygody (ukończone lekcje, nagrody, powtórki etapów) i jego świeża postać. */
import type {Home} from '../house/progress.ts';
import type {StageReview} from '../stage-review.ts';
import type {SectionPlan} from './section-plan.ts';
import type {Item} from './model.ts';
export interface Adventure extends Home {
  courseHomes?:Record<string,Home>;
  version:1;completed:Record<string,{at:string;edition?:2}>;
  reviewDay?:string;
  reviewSchema?:1;reviewArchiveHead?:string|null;stageReviews?:Record<string,StageReview>;
  sectionPlans?:Record<string,SectionPlan>;
  memory?:Record<string,{item:Item;correct:number}>;
}
export const freshAdventure=():Adventure=>({version:1,earned:0,completed:{},purchases:{}});
