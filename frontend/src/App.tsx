import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// For Choreo managed auth, use the window.configs if available, otherwise fallback
const getApiUrl = () => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.configs && window.configs.apiUrl) {
    // @ts-ignore
    return window.configs.apiUrl + '/todos';
  }
  return '/choreo-apis/choreo-mcp-demo/todo-backend/v1/todos';
};

const API_URL = getApiUrl();

// Configure axios to send credentials with every request
axios.defaults.withCredentials = true;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(API_URL)
      .then((response) => {
        setTodos(response.data || []);
        setIsLoggedIn(true);
      })
      .catch(err => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          window.location.href = '/auth/login';
        } else {
          setError('Could not fetch todos.');
          console.error(err);
        }
      });
  }, []);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    axios.post(API_URL, { text, completed: false })
      .then((response) => {
        setTodos([...todos, response.data]);
        setText('');
      })
      .catch(err => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          window.location.href = '/auth/login';
        } else {
          setError('Could not add todo.');
          console.error(err);
        }
      });
  };

  const toggleTodo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      axios.put(`${API_URL}/${id}`, { ...todo, completed: !todo.completed })
        .then(() => {
          setTodos(
            todos.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            )
          );
        })
        .catch(err => {
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            window.location.href = '/auth/login';
          } else {
            setError('Could not update todo.');
            console.error(err);
          }
        });
    }
  };

  const deleteTodo = (id: number) => {
    axios.delete(`${API_URL}/${id}`)
      .then(() => {
        setTodos(todos.filter((t) => t.id !== id));
      })
      .catch(err => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          window.location.href = '/auth/login';
        } else {
          setError('Could not delete todo.');
          console.error(err);
        }
      });
  };

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleLogout = () => {
    window.location.href = '/auth/logout';
  };

  return (
    <div className="App">
      <header>
        <h1>Todo App</h1>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="auth-button">Logout</button>
        ) : (
          <button onClick={handleLogin} className="auth-button">Login</button>
        )}
      </header>
      {error && <p className="error">{error}</p>}
      {isLoggedIn && (
        <>
          <form onSubmit={addTodo}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a new todo"
            />
            <button type="submit">Add</button>
          </form>
          <ul>
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={todo.completed ? 'completed' : ''}
              >
                <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
                <button onClick={() => deleteTodo(todo.id)} className="delete-button">Delete</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
