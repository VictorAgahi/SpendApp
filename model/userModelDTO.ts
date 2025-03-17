import {ExpenseDTO} from "@/model/expenseDTO";

export interface UserDTO {
    prenom: string;
    nom: string;
    email: string;
    pseudo: string;
    money: string;
    expenses: ExpenseDTO[];
}