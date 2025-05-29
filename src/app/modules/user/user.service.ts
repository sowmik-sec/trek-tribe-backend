/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';
import { IUploadFile } from '../../../interfaces/file';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';
import { hashedPassword } from './user.utils';
import prisma from '../../../shared/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { TPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { userSearchableFields } from './user.constant';

const createUserIntoDB = async (req: Request) => {
  const file = req.file as IUploadFile;
  if (file) {
    const uploadProfileImage = await FileUploadHelper.uploadToCloudinary(file);
    req.body.profilePhoto = uploadProfileImage?.secure_url;
  }
  const hashPassword = await hashedPassword(req.body.password);
  const result = await prisma.$transaction(async (tc) => {
    const newUser = await tc.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
        role: UserRole.USER,
      },
    });
    const newProfile = await tc.profile.create({
      data: {
        userId: newUser.id,
        bio: req.body.profile.bio,
        age: req.body.profile.age,
        profilePhoto: req.body.profilePhoto,
      },
    });
    return {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      age: newProfile.age,
      bio: newProfile.bio,
      profilePhoto: newProfile.profilePhoto,
      createdAt: newProfile.createdAt,
      updatedAt: newProfile.updatedAt,
    };
  });
  return result;
};

const updateUserIntoDB = async (req: Request) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: req.user.userId,
    },
  });
  const file = req.file as IUploadFile;
  if (file) {
    const uploadProfileImage = await FileUploadHelper.uploadToCloudinary(file);
    req.body.profilePhoto = uploadProfileImage?.secure_url;
  }

  const result = await prisma.$transaction(async (tc) => {
    const updateUser = await tc.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        name: req.body.name,
        email: req.body.email,
      },
    });
    const updateProfile = await tc.profile.update({
      where: {
        userId: req.user.userId,
      },
      data: {
        bio: req.body.profile.bio,
        age: req.body.profile.age,
        profilePhoto: req.body.profilePhoto,
      },
    });
    return {
      name: updateUser.name,
      email: updateUser.email,
      age: updateProfile.age,
      bio: updateProfile.bio,
      profilePhoto: updateProfile.profilePhoto,
      createdAt: updateProfile.createdAt,
      updatedAt: updateProfile.updatedAt,
    };
  });
  return result;
};
const getUsersFromDB = async (params: any, options: TPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filteredData } = params;
  const andConditions: Prisma.UserWhereInput[] = [];

  // Search term logic (assuming userSearchableFields are direct User string fields)
  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive', // Optional: for case-insensitive search
        },
      })),
    });
  }

  // Specific filters from filteredData
  if (Object.keys(filteredData).length > 0) {
    const specificFilters: Prisma.UserWhereInput[] = [];
    for (const key in filteredData) {
      if (Object.prototype.hasOwnProperty.call(filteredData, key)) {
        const value = (filteredData as any)[key];

        // --- Handle Profile fields ---
        if (key === 'age') {
          if (typeof value === 'number') {
            specificFilters.push({
              profile: {
                age: {
                  equals: value,
                },
              },
            });
          } else if (typeof value === 'string' && !isNaN(parseInt(value, 10))) {
            specificFilters.push({
              profile: {
                age: {
                  equals: parseInt(value, 10),
                },
              },
            });
          } else if (typeof value === 'object' && value !== null) {
            // Define the structure for age range filtering
            const ageRangeFilter: { gte?: number; lte?: number } = {}; // Use a simple object type

            const minAge = (value as any).min;
            const maxAge = (value as any).max;

            if (typeof minAge === 'number') {
              ageRangeFilter.gte = minAge;
            } else if (typeof minAge === 'string' && !isNaN(parseInt(minAge, 10))) {
              ageRangeFilter.gte = parseInt(minAge, 10);
            }

            if (typeof maxAge === 'number') {
              ageRangeFilter.lte = maxAge;
            } else if (typeof maxAge === 'string' && !isNaN(parseInt(maxAge, 10))) {
              ageRangeFilter.lte = parseInt(maxAge, 10);
            }

            if (Object.keys(ageRangeFilter).length > 0) {
              specificFilters.push({ profile: { age: ageRangeFilter } });
            } else {
              console.warn(
                `Age filter object provided but not in expected format (e.g., {min: X, max: Y}):`,
                value
              );
            }
          } else {
            console.warn(`Age filter value is not a processable number or range object:`, value);
          }
        } else if (key === 'bio') {
          // Another example for a profile text field
          specificFilters.push({
            profile: {
              bio: {
                contains: String(value),
                mode: 'insensitive',
              },
            },
          });
        }
        // --- Handle direct User fields ---
        else if (key === 'role' || key === 'status') {
          // Assuming role and status are enums on User
          specificFilters.push({
            [key]: {
              equals: value, // Prisma handles enums correctly with their string values
            },
          });
        } else if (key === 'email' || key === 'name') {
          // Direct user fields you might want to filter by 'equals'
          specificFilters.push({
            [key]: {
              equals: String(value),
            },
          });
        }
        // Add other direct User model fields here if needed
        // else {
        //   console.warn(`Unhandled filter key: ${key}`);
        // }
      }
    }
    if (specificFilters.length > 0) {
      andConditions.push({ AND: specificFilters });
    }
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // The rest of your function remains the same...
  console.dir(whereConditions, { depth: 'infinity' });
  console.log(params, options);
  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: 'desc',
          },
    include: {
      profile: true, // Keep this to include profile data in the response
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

export const UserServices = {
  createUserIntoDB,
  updateUserIntoDB,
  getUsersFromDB,
};
