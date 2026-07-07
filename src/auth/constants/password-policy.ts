export const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,}$/;

export const PASSWORD_POLICY_MESSAGE =
  'A senha deve ter mais de 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.';
