export enum TYPE {
    MONTHLY,
    WEEKLY,
}

export interface SalaireDTO {
    id : string
    name: string;
    duration: TYPE;
    price: number;
    date: Date;
    renewable : boolean;
}