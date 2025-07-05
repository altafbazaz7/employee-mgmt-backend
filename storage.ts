import { users, employees, type User, type InsertUser, type Employee, type InsertEmployee, type UpdateEmployee } from "./shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee methods
  getEmployees(filters?: { department?: string; status?: string; search?: string }): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updates: UpdateEmployee): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // Pagination
  getEmployeesPaginated(page: number, limit: number, filters?: { department?: string; status?: string; search?: string }): Promise<{ employees: Employee[]; total: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private employees: Map<number, Employee>;
  private currentUserId: number;
  private currentEmployeeId: number;
  private initialized: boolean = false;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.currentUserId = 1;
    this.currentEmployeeId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Create users synchronously for immediate availability
    this.createInitialUsers();
    this.initializeSampleEmployees();
    this.initialized = true;
  }

  private createInitialUsers() {
    // Create admin user with pre-hashed password for demo
    const admin: User = {
      id: this.currentUserId++,
      username: "admin",
      email: "admin@company.com",
      password: "$2b$10$nyJ.BJdYbYbxvhmsl.KCVOuKYsoJYIUtTMK.Z.ZnNmZWXI9/Fm0aW", // admin123
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create employee user with pre-hashed password for demo
    const employeeUser: User = {
      id: this.currentUserId++,
      username: "employee",
      email: "employee@company.com",
      password: "$2b$10$8U8nesFn4rs8tkR8E65C0uOWAFk60bte/W5smGEZ0AoWWnVXeH2iO", // employee123
      role: "employee",
      createdAt: new Date(),
    };
    this.users.set(employeeUser.id, employeeUser);
  }

  private initializeSampleEmployees() {
    const sampleEmployees: Omit<Employee, 'id'>[] = [
      {
        employeeId: "EMP001",
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        phone: "+1 (555) 123-4567",
        department: "Engineering",
        position: "Frontend Lead",
        salary: "85000",
        startDate: new Date("2022-01-15"),
        status: "active",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b8c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
        address: "123 Tech Street, San Francisco, CA 94105",
        dateOfBirth: new Date("1990-05-12"),
        emergencyContact: "John Johnson - +1 (555) 987-6543",
        skills: ["React", "JavaScript", "TypeScript", "Node.js", "GraphQL"],
        projects: ["E-commerce Platform", "Mobile App", "Dashboard Redesign"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        employeeId: "EMP002",
        name: "Michael Chen",
        email: "michael.chen@company.com",
        phone: "+1 (555) 234-5678",
        department: "Product",
        position: "Senior PM",
        salary: "95000",
        startDate: new Date("2021-08-20"),
        status: "active",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
        address: "456 Innovation Ave, Austin, TX 78701",
        dateOfBirth: new Date("1988-09-23"),
        emergencyContact: "Lisa Chen - +1 (555) 876-5432",
        skills: ["Product Strategy", "Data Analysis", "User Research", "Agile", "Roadmapping"],
        projects: ["Product Roadmap 2024", "User Analytics", "Market Research"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        employeeId: "EMP003",
        name: "Emma Rodriguez",
        email: "emma.rodriguez@company.com",
        phone: "+1 (555) 345-6789",
        department: "Marketing",
        position: "Growth Lead",
        salary: "78000",
        startDate: new Date("2022-03-10"),
        status: "active",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
        address: "789 Marketing Blvd, New York, NY 10001",
        dateOfBirth: new Date("1992-11-07"),
        emergencyContact: "Carlos Rodriguez - +1 (555) 765-4321",
        skills: ["Digital Marketing", "SEO", "Content Strategy", "Social Media", "Analytics"],
        projects: ["Brand Campaign", "SEO Optimization", "Social Media Strategy"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        employeeId: "EMP004",
        name: "David Kim",
        email: "david.kim@company.com",
        phone: "+1 (555) 456-7890",
        department: "Engineering",
        position: "Full Stack",
        salary: "82000",
        startDate: new Date("2021-11-05"),
        status: "on_leave",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
        address: "321 Code Lane, Seattle, WA 98101",
        dateOfBirth: new Date("1991-03-18"),
        emergencyContact: "Jenny Kim - +1 (555) 654-3210",
        skills: ["Node.js", "Python", "PostgreSQL", "AWS", "Docker"],
        projects: ["API Development", "Database Migration", "Cloud Infrastructure"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        employeeId: "EMP005",
        name: "Lisa Thompson",
        email: "lisa.thompson@company.com",
        phone: "+1 (555) 567-8901",
        department: "Human Resources",
        position: "Senior HR",
        salary: "72000",
        startDate: new Date("2020-05-12"),
        status: "active",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
        address: "654 People Street, Chicago, IL 60601",
        dateOfBirth: new Date("1987-07-25"),
        emergencyContact: "Mark Thompson - +1 (555) 543-2109",
        skills: ["Recruitment", "Employee Relations", "Performance Management", "Policy Development"],
        projects: ["Hiring Process", "Employee Handbook", "Performance Reviews"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        employeeId: "EMP006",
        name: "James Wilson",
        email: "james.wilson@company.com",
        phone: "+1 (555) 678-9012",
        department: "Sales",
        position: "Regional Lead",
        salary: "105000",
        startDate: new Date("2019-09-18"),
        status: "active",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150",
        address: "987 Sales Plaza, Miami, FL 33101",
        dateOfBirth: new Date("1985-12-14"),
        emergencyContact: "Susan Wilson - +1 (555) 432-1098",
        skills: ["Sales Strategy", "Client Relations", "Negotiation", "Team Leadership"],
        projects: ["Q4 Sales Campaign", "Client Onboarding", "Territory Expansion"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleEmployees.forEach(emp => {
      const employee: Employee = { ...emp, id: this.currentEmployeeId++ };
      this.employees.set(employee.id, employee);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      password: hashedPassword,
      role: insertUser.role || "employee",
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getEmployees(filters?: { department?: string; status?: string; search?: string }): Promise<Employee[]> {
    let employees = Array.from(this.employees.values());

    if (filters?.department) {
      employees = employees.filter(emp => emp.department.toLowerCase() === filters.department!.toLowerCase());
    }

    if (filters?.status) {
      employees = employees.filter(emp => emp.status === filters.status);
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      employees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.employeeId.toLowerCase().includes(searchTerm) ||
        emp.department.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm)
      );
    }

    return employees;
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.employeeId === employeeId);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const employee: Employee = {
      ...insertEmployee,
      id: this.currentEmployeeId++,
      status: insertEmployee.status || "active",
      phone: insertEmployee.phone || null,
      salary: insertEmployee.salary || null,
      startDate: insertEmployee.startDate || null,
      avatar: insertEmployee.avatar || null,
      address: insertEmployee.address || null,
      dateOfBirth: insertEmployee.dateOfBirth || null,
      emergencyContact: insertEmployee.emergencyContact || null,
      skills: insertEmployee.skills || [],
      projects: insertEmployee.projects || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(employee.id, employee);
    return employee;
  }

  async updateEmployee(id: number, updates: UpdateEmployee): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;

    const updatedEmployee: Employee = {
      ...employee,
      ...updates,
      updatedAt: new Date(),
    };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  async getEmployeesPaginated(
    page: number,
    limit: number,
    filters?: { department?: string; status?: string; search?: string }
  ): Promise<{ employees: Employee[]; total: number }> {
    const allEmployees = await this.getEmployees(filters);
    const total = allEmployees.length;
    const start = (page - 1) * limit;
    const employees = allEmployees.slice(start, start + limit);

    return { employees, total };
  }
}

export const storage = new MemStorage();
