export class CommentDto {
    constructor(
        public id: number = 0,
        public taskId: number = 0,
        public userId: number = 0,
        public content: string = "",
        public createdAt: Date = new Date()
    ) { }
}