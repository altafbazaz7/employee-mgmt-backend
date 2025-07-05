// @ts-nocheck
import { AuthenticationError, ForbiddenError, UserInputError } from "apollo-server-express";
import { storage } from "../storage";
import { generateToken, JWTPayload } from "../utils/jwt";
import bcrypt from "bcryptjs";
import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

const DateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  Date: DateScalar,

  Query: {
    me: async (_: any, __: any, context: { user?: JWTPayload }) => {
      if (!context.user) {
        throw new AuthenticationError("Authentication required");
      }

      return await storage.getUser(context.user.userId);
    },

    employees: async (
      _: any,
      { filters }: { filters?: { department?: string; status?: string; search?: string } },
      context: { user?: JWTPayload }
    ) => {
      if (!context.user) {
        throw new AuthenticationError("Authentication required");
      }

      return await storage.getEmployees(filters);
    },

    employee: async (
      _: any,
      { id }: { id: string },
      context: { user?: JWTPayload }
    ) => {
      if (!context.user) {
        throw new AuthenticationError("Authentication required");
      }

      const employee = await storage.getEmployee(parseInt(id));
      if (!employee) {
        throw new UserInputError("Employee not found");
      }

      return employee;
    },

    employeesPaginated: async (
      _: any,
      { page, limit, filters }: { page: number; limit: number; filters?: { department?: string; status?: string; search?: string } },
      context: { user?: JWTPayload }
    ) => {
      if (!context.user) {
        throw new AuthenticationError("Authentication required");
      }

      return await storage.getEmployeesPaginated(page, limit, filters);
    },
  },

  Mutation: {
    login: async (
      _: any,
      { input }: { input: { username: string; password: string } }
    ) => {
      const user = await storage.getUserByUsername(input.username);
      if (!user) {
        throw new AuthenticationError("Invalid credentials");
      }

      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new AuthenticationError("Invalid credentials");
      }

      const token = generateToken(user);
      return { token, user };
    },

    register: async (
      _: any,
      { input }: { input: { username: string; email: string; password: string; role?: string } }
    ) => {
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        throw new UserInputError("Username already exists");
      }

      const existingEmail = await storage.getUserByEmail(input.email);
      if (existingEmail) {
        throw new UserInputError("Email already exists");
      }

      const user = await storage.createUser({
        username: input.username,
        email: input.email,
        password: input.password,
        role: input.role || "employee",
      });

      const token = generateToken(user);
      return { token, user };
    },

    createEmployee: async (
      _: any,
      { input }: { input: any },
      context: { user?: JWTPayload }
    ) => {
      if (!context.user) {
        throw new AuthenticationError("Authentication required");
      }

      if (context.user.role !== "admin") {
        throw new ForbiddenError("Admin access required");
      }

      const existingEmployee = await storage.getEmployeeByEmployeeId(input.employeeId);
      if (existingEmployee) {
        throw new UserInputError("Employee ID already exists");
      }

      return await storage.createEmployee(input);
    },

    updateEmployee: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: { user?: JWTPayload }
    ) => {
      if (!context.user) {
        throw new AuthenticationError("Authentication required");
      }

      if (context.user.role !== "admin") {
        throw new ForbiddenError("Admin access required");
      }

      const employee = await storage.updateEmployee(parseInt(id), input);
      if (!employee) {
        throw new UserInputError("Employee not found");
      }

      return employee;
    },

    deleteEmployee: async (
      _: any,
      { id }: { id: string },
      context: { user?: JWTPayload }
    ) => {
      if (!context.user) {
        throw new AuthenticationError("Authentication required");
      }

      if (context.user.role !== "admin") {
        throw new ForbiddenError("Admin access required");
      }

      const success = await storage.deleteEmployee(parseInt(id));
      if (!success) {
        throw new UserInputError("Employee not found");
      }

      return true;
    },
  },
};
