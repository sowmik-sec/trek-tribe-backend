import bcrypt from 'bcrypt';

async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const match: boolean = await bcrypt.compare(plainTextPassword, hashedPassword);
    return match;
  } catch (error) {
    throw new Error(`Error comparing passwords ${error}`);
  }
}

export const AuthUtils = {
  comparePasswords,
};
