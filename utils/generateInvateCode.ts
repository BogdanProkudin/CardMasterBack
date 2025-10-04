export const generateInviteCode = () => {
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...Array(10)].reduce((a) => a + p[~~(Math.random() * p.length)], "");
};
