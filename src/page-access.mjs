export function protectedPageAccess(path, user) {
  const adminPage = path === "/admin" || path === "/admin.html";
  const authorPage = path === "/author" || path === "/author.html" ||
    path === "/author/studio" || path.startsWith("/author/studio/");
  if (!adminPage && !authorPage) return { allowed: true, status: 200 };
  if (!user) return { allowed: false, status: 401 };
  if (adminPage) return user.role === "admin"
    ? { allowed: true, status: 200 }
    : { allowed: false, status: 403 };
  return user.role === "admin" || user.role === "author"
    ? { allowed: true, status: 200 }
    : { allowed: false, status: 403 };
}
