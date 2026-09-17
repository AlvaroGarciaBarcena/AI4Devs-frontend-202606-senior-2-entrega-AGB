import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class Employee {
    id?: number;
    companyId: number;
    name: string;
    email: string;
    // Hash de bcrypt, nunca la contraseña en claro (ver authService.ts).
    // Puede ser null: un Employee sin contraseña asignada existe (para el
    // resto de la app, p. ej. como entrevistador) pero no puede iniciar
    // sesión.
    password: string | null;
    role: string;
    isActive: boolean;

    constructor(data: any) {
        this.id = data.id;
        this.companyId = data.companyId;
        this.name = data.name;
        this.email = data.email;
        this.password = data.password ?? null;
        this.role = data.role;
        this.isActive = data.isActive ?? true;
    }

    async save() {
        const employeeData: any = {
            companyId: this.companyId,
            name: this.name,
            email: this.email,
            password: this.password,
            role: this.role,
            isActive: this.isActive,
        };

        if (this.id) {
            return await prisma.employee.update({
                where: { id: this.id },
                data: employeeData,
            });
        } else {
            return await prisma.employee.create({
                data: employeeData,
            });
        }
    }

    static async findOne(id: number): Promise<Employee | null> {
        const data = await prisma.employee.findUnique({
            where: { id: id },
        });
        if (!data) return null;
        return new Employee(data);
    }

    static async findByEmail(email: string): Promise<Employee | null> {
        const data = await prisma.employee.findUnique({
            where: { email },
        });
        if (!data) return null;
        return new Employee(data);
    }
}

