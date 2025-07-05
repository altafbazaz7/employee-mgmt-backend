// @ts-nocheck
import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar Date

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: Date!
  }

  type Employee {
    id: ID!
    employeeId: String!
    name: String!
    email: String!
    phone: String
    department: String!
    position: String!
    salary: String
    startDate: Date
    status: String!
    avatar: String
    address: String
    dateOfBirth: Date
    emergencyContact: String
    skills: [String!]
    projects: [String!]
    createdAt: Date!
    updatedAt: Date!
  }

  type EmployeesResponse {
    employees: [Employee!]!
    total: Int!
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    role: String
  }

  input EmployeeInput {
    employeeId: String!
    name: String!
    email: String!
    phone: String
    department: String!
    position: String!
    salary: String
    startDate: Date
    status: String
    avatar: String
    address: String
    dateOfBirth: Date
    emergencyContact: String
    skills: [String!]
    projects: [String!]
  }

  input UpdateEmployeeInput {
    employeeId: String
    name: String
    email: String
    phone: String
    department: String
    position: String
    salary: String
    startDate: Date
    status: String
    avatar: String
    address: String
    dateOfBirth: Date
    emergencyContact: String
    skills: [String!]
    projects: [String!]
  }

  input EmployeeFilters {
    department: String
    status: String
    search: String
  }

  type Query {
    me: User
    employees(filters: EmployeeFilters): [Employee!]!
    employee(id: ID!): Employee
    employeesPaginated(page: Int!, limit: Int!, filters: EmployeeFilters): EmployeesResponse!
  }

  type Mutation {
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    createEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean!
  }
`;
