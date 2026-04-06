export class ProjectWatcher {
  public constructor(
    public projectId: number = 0,
    public userId: number = 0,
    public watchingSince: Date = new Date()
  ) {}
}