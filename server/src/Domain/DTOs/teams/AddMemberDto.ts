export class AddMemberDto{
    public constructor(
        public username : string
    ) {}
}

//mora DTO za ovo jer u rutama pise da se username ne prenosi preko url-a