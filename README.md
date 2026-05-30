# Student Marks Tracker

A Next.js application for tracking student performance during their internships. It allows incharges to add students with optional internship date windows, record daily performance marks with remark bands (Terrible to Excellent), and view aggregate scorecards.

## Features

- **Daily Mark Entry**: Record daily performance marks (1-10) for active students.
- **Internship Date Windows**: Define start and end dates for a student's internship. The system automatically handles eligibility, only showing students on days they are active.
- **Holiday Awareness**: Automatically blocks mark entry on non-working days (Sundays and 2nd Saturdays).
- **Performance Scorecards**: View aggregate metrics per student, including average mark, coverage (working days), and a breakdown of performance bands.
- **Soft Deletion**: Remove students from the active view while preserving their historical mark data.
- **Theme Support**: Includes a dark/light mode toggle.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: SQLite (via `better-sqlite3`)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: Vanilla CSS with modern custom properties

## Getting Started

First, install the dependencies if you haven't already:

```powershell
npm.cmd install
```

Ensure your database is set up and migrations are applied:

```powershell
npx.cmd prisma migrate dev
npx.cmd prisma generate
```

Then, run the development server:

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Viewing the Database

This project uses a local SQLite database stored in `prisma/dev.db`. The easiest way to view and interact with your database directly is by using **Prisma Studio**, a visual editor for the data in your database.

To open Prisma Studio, open a PowerShell terminal and run:

```powershell
# 1. Navigate to the project directory
cd C:\Users\NETCOM\.gemini\antigravity-ide\scratch\student-marks-tracker

# 2. Start Prisma Studio
npx.cmd prisma studio
```

This will start a local server (typically at `http://localhost:5555`) and open it in your default browser. From there, you can view the `Student` and `Mark` tables, inspect rows, and make manual edits if necessary.

Alternatively, you can open the `prisma/dev.db` file directly using an IDE extension like "SQLite Viewer" or a standalone GUI client like DB Browser for SQLite.

## Clearing the Database

If you want to completely wipe all data and start fresh, you can reset the database. This will drop the database, recreate it, and apply all migrations from scratch.

Run the following command in your terminal (make sure you are in the project directory):

```powershell
npx.cmd prisma migrate reset
```

It will ask you to confirm that you want to reset the database. Type `y` and press Enter.
