import { Container } from "@/components/layout/container";

export default function AdminDashboardPage() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Admin dashboard
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Product/category/order management is built in a later phase. This
        placeholder confirms the route is protected -- only signed-in users
        with the admin role can reach it.
      </p>
    </Container>
  );
}
