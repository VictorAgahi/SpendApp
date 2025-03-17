export interface ExpenseDTO {
    id : string
    name: string;
    days: number;
    initialPrice: string;
    currentPrice: string;
    deadline: string;
    renewable : boolean
}