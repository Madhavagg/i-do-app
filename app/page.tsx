import AddTodo from "@/components/AddTodo";
import FilterBar from "@/components/FilterBar";
import TodoList from "@/components/TodoList";
import UserMenu from "@/components/UserMenu";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-end mb-4">
            <UserMenu />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">I do</h1>
            <p className="text-gray-500 mt-2">Stay organized, get things done</p>
          </div>
        </header>

        <AddTodo />
        <FilterBar />
        <TodoList />
      </div>
    </main>
  );
}
