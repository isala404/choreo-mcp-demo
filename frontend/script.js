const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

const API_URL = 'https://47d6f5f8-80c4-4937-ad73-b962f0fa0c53-dev.e1-us-east-azure.choreoapis.dev/todochoreoapp/todo-backend-service/v1.0';

// Fetch todos from the backend
async function getTodos() {
    try {
        const response = await fetch(`${API_URL}/todos`);
        const todos = await response.json();
        renderTodos(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

// Render todos to the UI
function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.dataset.id = todo.id;
        if (todo.completed) {
            li.classList.add('completed');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleTodo(todo.id, !todo.completed));

        const span = document.createElement('span');
        span.textContent = todo.task;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.addEventListener('click', () => deleteTodo(todo.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteButton);
        todoList.appendChild(li);
    });
}

// Add a new todo
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = todoInput.value.trim();
    if (task) {
        try {
            const response = await fetch(`${API_URL}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task, completed: false })
            });
            const newTodo = await response.json();
            getTodos(); // Re-fetch to get the new ID
            todoInput.value = '';
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }
});

// Toggle todo completion status
async function toggleTodo(id, completed) {
    try {
        await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        });
        getTodos();
    } catch (error) {
        console.error('Error updating todo:', error);
    }
}

// Delete a todo
async function deleteTodo(id) {
    try {
        await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE'
        });
        getTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}

// Initial fetch
getTodos();
