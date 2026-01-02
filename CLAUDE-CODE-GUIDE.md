# Claude Code Conversation Guide
## How to Build This Product with Natural Language

This guide teaches you how to effectively communicate with Claude Code to build your to-do app. No code knowledge required—just clear communication.

---

## 🎯 How Claude Code Works

You talk to Claude Code like a colleague:
- **You describe** what you want
- **Claude Code builds** it
- **You review** in Cursor
- **You iterate** until it's right

---

## 🗣️ Communication Principles

### 1. Be Specific, Not Vague
```
❌ "Make it better"
✅ "Add a red border to overdue tasks"

❌ "Build a to-do app"
✅ "Create a task list component that shows task title and a checkbox"
```

### 2. One Thing at a Time
```
❌ "Add editing, deleting, filtering, and sorting"
✅ "Add a delete button to each task"
   (then) "Now add inline editing for task titles"
   (then) "Now add filter tabs for All/Active/Completed"
```

### 3. Describe the User Experience
```
❌ "Add localStorage"
✅ "Make sure tasks are saved so they still appear when I refresh the page"
```

### 4. Reference What Exists
```
❌ "Add a button"
✅ "Add a delete button next to the checkbox in the TaskItem component"
```

---

## 📍 Phase 0: Getting Started

### Starting a Session
```
You: I'm building an AI-powered to-do app. Let's start by setting up 
     a Next.js project with TypeScript and Tailwind CSS.
```

### Understanding the Project
```
You: What files are in this project?
You: Explain the folder structure to me
You: What's in the package.json?
```

### Useful Commands
```
/help     - See all commands
/cost     - Check how much you've spent
/compact  - Summarize conversation to save tokens
/clear    - Start fresh
```

---

## 📍 Phase 1: Building the Core App

### Session 1: Project Setup (~30 min)
```
You: Set up a new Next.js 14 project with TypeScript, Tailwind CSS, 
     and the App Router. Use the src directory structure.

You: Create a basic page layout with a header that says "My Tasks" 
     and a main content area. Make it look modern and clean.
```

**Review in Cursor:** Check that the project structure looks right, run `npm run dev`

### Session 2: Task Display (~1 hour)
```
You: Create a TaskItem component that displays:
     - A checkbox on the left
     - The task title
     - When checked, the title should have a strikethrough
     
     Make it look nice with hover effects.

You: Create a TaskList component that displays multiple tasks.
     For now, use some hardcoded example tasks so we can see it working.

You: Add some padding and spacing so the list doesn't look cramped.
```

**Review in Cursor:** Check the components look right, interact with the checkboxes

### Session 3: Adding Tasks (~1 hour)
```
You: Add an input field at the top where I can type a new task.
     When I press Enter, it should add the task to the list.

You: Clear the input field after adding a task.

You: If I try to add an empty task, don't add it.
```

**Review:** Try adding several tasks, try adding empty ones

### Session 4: Completing & Deleting (~1 hour)
```
You: Make the checkboxes actually work - clicking should toggle 
     the completed state of that task.

You: Add a delete button (maybe a trash icon or X) to each task.
     It should appear when I hover over the task.

You: When I click delete, remove that task from the list.
```

### Session 5: Filtering (~1 hour)
```
You: Add three filter tabs above the task list: All, Active, Completed.
     
     - All shows everything
     - Active shows only unchecked tasks  
     - Completed shows only checked tasks

You: Show the count of tasks in each filter, like "Active (5)"

You: Make the current filter tab look selected/highlighted.
```

### Session 6: Due Dates & Priority (~1-2 hours)
```
You: Add a due date field to tasks. When adding a task, I should be 
     able to optionally set when it's due.

You: Display the due date next to each task. If it's overdue, 
     make it stand out (maybe red text).

You: Add priority levels - High, Medium, Low. Show high priority 
     tasks with a red badge or indicator.

You: Let me sort tasks by due date or by priority.
```

### Session 7: Persistence (~30 min)
```
You: Save all tasks to localStorage so they persist when I refresh 
     the page.

You: Load the saved tasks when the app starts.

You: Also save the current filter selection.
```

### Session 8: Polish (~1 hour)
```
You: Add a nice empty state when there are no tasks - maybe a 
     friendly message and icon.

You: Add smooth animations when tasks are added or removed.

You: Make sure it looks good on mobile phones too.

You: Add a dark mode toggle.
```

### Phase 1 Review Checklist
After completing Phase 1, verify:
- [ ] Can add new tasks
- [ ] Can check/uncheck tasks
- [ ] Can delete tasks
- [ ] Can filter All/Active/Completed
- [ ] Can set due dates
- [ ] Can set priorities
- [ ] Tasks survive page refresh
- [ ] Looks good on mobile
- [ ] Empty state shows when no tasks

---

## 📍 Phase 2: Adding AI Features

### Session 1: API Route Setup (~30 min)
```
You: Create an API route that will parse natural language task input.
     It should accept text like "Buy groceries tomorrow" and return 
     structured data with the task title and due date.
     
     Use OpenAI's API - I have an API key set as OPENAI_API_KEY.
     Use gpt-4o-mini model to keep costs low.

You: Make sure the API returns JSON with: title, dueDate, priority, 
     and category.
```

### Session 2: Natural Language Input (~1 hour)
```
You: Update the task input to send the text to our AI parser.
     While it's thinking, show a loading indicator.

You: When the AI returns the parsed data, create the task with 
     those details filled in automatically.

You: If the AI fails, just create a simple task with the text as 
     the title - don't break the flow.

You: Show the user what the AI interpreted - let them see the 
     suggested due date and priority before confirming.
```

### Session 3: Smart Features (~1-2 hours)
```
You: Add AI-powered category suggestions. When I add a task, 
     the AI should suggest a category based on the content.
     I should be able to accept or change it.

You: Add a "break down task" button. When clicked, the AI should 
     suggest subtasks for complex tasks like "Plan birthday party".

You: Show me the subtasks and let me accept, modify, or reject them.
```

### Session 4: Observability Dashboard (~1-2 hours)
```
You: Log every AI API call - save the input, output, how long it 
     took, and how many tokens were used.

You: Create a simple dashboard page where I can see:
     - Total AI calls today
     - Average response time
     - Total tokens used
     - Estimated cost
     - Recent AI calls with details

You: Calculate the cost based on OpenAI's pricing for gpt-4o-mini.
```

### Phase 2 Review Checklist
- [ ] Can type "Buy groceries tomorrow" and get correct task
- [ ] AI parses dates like "next Monday", "in 3 days"
- [ ] AI suggests categories
- [ ] Can break down complex tasks
- [ ] Graceful handling when AI fails
- [ ] Can see AI usage stats
- [ ] Know roughly what AI is costing

---

## 📍 Phase 3: Database & Authentication

### Session 1: Database Setup (~1 hour)
```
You: Set up a SQLite database using Prisma to store tasks.
     Create the schema for Users and Tasks tables.

You: Migrate the database and generate the Prisma client.

You: Update the app to save tasks to the database instead of 
     localStorage.
```

### Session 2: Authentication (~2 hours)
```
You: Add user authentication using NextAuth.js. Start with just 
     email/password login.

You: Create a signup page where new users can register.

You: Create a login page.

You: Add a logout button in the header.

You: Protect the main app - redirect to login if not authenticated.
```

### Session 3: User Data Isolation (~1 hour)
```
You: Make sure each user only sees their own tasks.

You: Update all task queries to filter by the current user.

You: Test that User A cannot see User B's tasks.
```

### Session 4: OAuth (Optional) (~1 hour)
```
You: Add Google login as an option.

You: Add GitHub login as an option.
```

---

## 📍 Phase 4: AI Actions

### Session 1: Tool Definitions (~1 hour)
```
You: Set up OpenAI function calling. Define these tools:
     - create_task: Creates a task
     - update_task: Updates a task
     - create_calendar_event: Adds to Google Calendar
     - send_reminder: Sends an email reminder

You: Create a chat interface where I can give commands like 
     "Create a task to call mom tomorrow and add it to my calendar"

You: The AI should decide which tools to use and execute them.
```

### Session 2: Calendar Integration (~2 hours)
```
You: Add Google Calendar OAuth so users can connect their calendar.

You: Implement the create_calendar_event tool to actually create 
     events in Google Calendar.

You: When creating tasks with times, offer to add them to calendar.
```

### Session 3: Email Reminders (~1 hour)
```
You: Set up an email service (use Resend) for sending reminders.

You: Implement scheduled reminders - send email X hours before due.

You: Let users configure their reminder preferences.
```

### Session 4: Action Confirmation (~1 hour)
```
You: Before the AI sends an email or creates a calendar event, 
     show me what it's about to do and ask for confirmation.

You: Log all AI actions so I can see what the AI has done.
```

---

## 📍 Phase 5: Agentic Features

### Session 1: Daily Planning (~2 hours)
```
You: Create a daily planning feature. Each morning (or on demand), 
     analyze my tasks and calendar to suggest a realistic daily plan.

You: Show the suggested plan with time blocks.

You: Let me accept, modify, or dismiss the suggestions.
```

### Session 2: Pattern Recognition (~2 hours)
```
You: Analyze my completed tasks to find patterns. 
     For example, if I exercise every Monday, suggest making it recurring.

You: Show me insights about my productivity patterns.

You: Suggest recurring tasks based on what I do regularly.
```

### Session 3: Smart Notifications (~1-2 hours)
```
You: Add proactive suggestions - if I'm overloaded, suggest 
     rescheduling some tasks.

You: Create a weekly review that summarizes what I accomplished 
     and suggests focus areas for next week.
```

### Session 4: User Controls (~1 hour)
```
You: Add a settings page where I can control the AI assistant:
     - Enable/disable daily planning
     - Set preferred planning time
     - Enable/disable proactive suggestions
     - Control how much autonomy the AI has
```

---

## 🔧 Troubleshooting with Claude Code

### When Something Doesn't Work
```
You: The checkbox isn't working. When I click it, nothing happens.
     Can you check the onClick handler?

You: I'm getting an error that says [paste error message].
     Can you fix it?

You: The tasks aren't saving to localStorage. Can you debug this?
```

### When You Want to Understand
```
You: Explain how the filtering logic works.

You: Walk me through what happens when I add a new task.

You: Why did you choose to structure it this way?
```

### When You Want Changes
```
You: I don't like how the delete button looks. Make it more subtle.

You: The animation is too slow. Speed it up.

You: Can we change the color scheme to something more professional?
```

---

## 💡 Pro Tips

### 1. Review After Each Feature
Don't build 5 things then review. Build one thing, verify it works, then continue.

### 2. Use /compact Regularly
Long conversations use more tokens (= more cost). Use `/compact` every hour or so.

### 3. Be Explicit About Files
```
You: In the TaskItem component, add a delete button
```
is better than
```
You: Add a delete button
```

### 4. Ask Questions
```
You: What's the best way to handle this?
You: What are the trade-offs between these approaches?
You: Is there a simpler way to do this?
```

### 5. Trust But Verify
Claude Code is powerful but can make mistakes. Always test what it builds.

---

## 📅 Suggested Weekly Schedule (10 hrs/week)

| Day | Time | Activity |
|-----|------|----------|
| Mon | 2 hrs | Build features with Claude Code |
| Wed | 2 hrs | Continue building, review what's working |
| Thu | 2 hrs | Build features with Claude Code |
| Sat | 3 hrs | Polish, fix issues, plan next week |
| Sun | 1 hr | Review what you learned, update notes |

---

Good luck building! 🚀



