import { ProjectStatus } from '../enums/ProjectStatus';
import { Priority } from '../enums/Priority';
 
export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: Priority;
  tagId?: number;
} // potrebno zbog API endpointa (frontend poziva ovaj endpoint)