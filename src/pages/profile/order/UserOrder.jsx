import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const UserOrder = () => {

    const headerItems = [
  { name: "Stocks", link: "stocks" },
  { name: "F&O", link: "futures-and-options" },
  { name: "Mutual Funds", link: "mutual-funds" },
    ]


  return (
  <div
  className="
    bg-white text-blue-950 lg:px-18 px-4 py-4

    dark:bg-[var(--app-bg)]
    dark:text-[var(--text-primary)]
  "
>
  <h1
    className="
      text-xl lg:text-3xl font-semibold
      text-blue-950

      dark:text-[var(--text-primary)]
    "
  >
    All Orders
  </h1>

  <div
    className="
      flex gap-8 text-md font-medium overflow-x-auto mt-4
      border-b px-2

      border-gray-200
      dark:border-[var(--border-color)]
    "
  >
    {headerItems.map((item) => (
      <NavLink
        key={item.name}
        to={item.link}
        end
        className={({ isActive }) =>
          `
          relative transition pb-1
          text-gray-600 hover:text-blue-800

          after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2
          after:w-[140%] after:h-0.5 after:bg-blue-800
          after:scale-x-0 hover:after:scale-x-100
          after:origin-center after:transition-transform after:duration-300

          ${
            isActive
              ? "text-blue-800 after:scale-x-100"
              : ""
          }

          dark:text-[var(--text-secondary)]
          dark:hover:text-blue-400
          dark:after:bg-blue-400
          ${
            isActive
              ? "dark:text-blue-400"
              : ""
          }
          `
        }
      >
        {item.name}
      </NavLink>
    ))}
  </div>

  <Outlet />
</div>

  )
}

export default UserOrder