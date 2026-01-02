import AddTodo from "@/components/AddTodo";
import FilterBar from "@/components/FilterBar";
import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">I do</h1>
          <p className="text-gray-500 mt-2">Stay organized, get things done</p>
        </header>

        <AddTodo />
        <FilterBar />
        <TodoList />
      </div>
    </main>
  );
}
