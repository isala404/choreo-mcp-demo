package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v4"
)

type Todo struct {
	ID        int    `json:"id"`
	Text      string `json:"text"`
	Completed bool   `json:"completed"`
}

var conn *pgx.Conn

func main() {
	var err error
	
	// Construct DATABASE_URL from Choreo connection variables
	hostname := os.Getenv("CHOREO_CONNECTION_TODO_BACKEND_DEFAULTDB_HOSTNAME")
	port := os.Getenv("CHOREO_CONNECTION_TODO_BACKEND_DEFAULTDB_PORT")
	username := os.Getenv("CHOREO_CONNECTION_TODO_BACKEND_DEFAULTDB_USERNAME")
	password := os.Getenv("CHOREO_CONNECTION_TODO_BACKEND_DEFAULTDB_PASSWORD")
	database := os.Getenv("CHOREO_CONNECTION_TODO_BACKEND_DEFAULTDB_DATABASENAME")
	
	// Fallback to DATABASE_URL if Choreo variables are not available
	dbURL := os.Getenv("DATABASE_URL")
	if hostname != "" && port != "" && username != "" && password != "" && database != "" {
		dbURL = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=require", username, password, hostname, port, database)
	}
	
	if dbURL == "" {
		log.Fatalf("Database connection string not found. Please set DATABASE_URL or Choreo connection variables.")
	}
	
	conn, err = pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(context.Background())

	createTable()

	r := mux.NewRouter()
	r.HandleFunc("/todos", getTodos).Methods("GET")
	r.HandleFunc("/todos", createTodo).Methods("POST")
	r.HandleFunc("/todos/{id}", updateTodo).Methods("PUT")
	r.HandleFunc("/todos/{id}", deleteTodo).Methods("DELETE")

	// Use custom CORS middleware
	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(r)))
}

// Custom CORS middleware that allows any origin and credentials
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func createTable() {
	_, err := conn.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS todos (
			id SERIAL PRIMARY KEY,
			text TEXT NOT NULL,
			completed BOOLEAN NOT NULL
		)
	`)
	if err != nil {
		log.Fatalf("Unable to create table: %v\n", err)
	}
}

func getTodos(w http.ResponseWriter, r *http.Request) {
	rows, err := conn.Query(context.Background(), "SELECT id, text, completed FROM todos")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var todos []Todo
	for rows.Next() {
		var todo Todo
		if err := rows.Scan(&todo.ID, &todo.Text, &todo.Completed); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		todos = append(todos, todo)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todos)
}

func createTodo(w http.ResponseWriter, r *http.Request) {
	var todo Todo
	if err := json.NewDecoder(r.Body).Decode(&todo); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := conn.QueryRow(context.Background(),
		"INSERT INTO todos (text, completed) VALUES ($1, $2) RETURNING id",
		todo.Text, todo.Completed).Scan(&todo.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(todo)
}

func updateTodo(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var todo Todo
	if err := json.NewDecoder(r.Body).Decode(&todo); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := conn.Exec(context.Background(),
		"UPDATE todos SET text = $1, completed = $2 WHERE id = $3",
		todo.Text, todo.Completed, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func deleteTodo(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	_, err := conn.Exec(context.Background(), "DELETE FROM todos WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
