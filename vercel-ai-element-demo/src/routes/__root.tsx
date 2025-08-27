import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: Index,
})

function Index() {

    return (
    <>
        <Link to="/" className="[&.active]:font-bold">
            Home
        </Link>{' '}
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}