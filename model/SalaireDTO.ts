enum TYPE {
    MONTHLY,
    WEEKLY,
}

export interface SalaireDTO {
    id : string
    name: string;
    duration: TYPE;
    price: number;
    deadline: string;
    renewable : boolean
}