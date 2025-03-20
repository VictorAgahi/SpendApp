import {ExpenseDTO} from "@/model/expenseDTO";
import {SalaireDTO} from "@/model/SalaireDTO";
import {IncomeDTO} from "@/model/IncomeDTO";
import {TransfertDTO} from "@/model/TransfertDTO";
export interface UserDTO {
    prenom: string;
    nom: string;
    email: string;
    pseudo: string;
    money: string;
    expenses: ExpenseDTO[] | [];
    incomes: IncomeDTO[] | [];
    transferts: TransfertDTO[] | [];
    salaries: SalaireDTO [] | [];
}