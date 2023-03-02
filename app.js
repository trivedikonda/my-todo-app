const express = require("express");
const app = express();
app.use(express.json());
const format = require("date-fns/format"); //formats the date
const isMatch = require("date-fns/isMatch"); //date match
var isValid = require("date-fns/isValid"); //date valid
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjToResponseObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  const { category, status, priority, search_q = "" } = request.query;
  let getTodosQuery = "";

  switch (true) {
    //scenario1:
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((todoObj) => convertDbObjToResponseObj(todoObj))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //scenario2:
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((todoObj) => convertDbObjToResponseObj(todoObj))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    //scenario3:
    case hasPriorityAndStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((todoObj) => convertDbObjToResponseObj(todoObj))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    //scenario4:
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((todoObj) => convertDbObjToResponseObj(todoObj)));
      break;

    //scenario5:
    case hasCategoryAndStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((todoObj) => convertDbObjToResponseObj(todoObj))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //scenario6:
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((todoObj) => convertDbObjToResponseObj(todoObj))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //scenario7:
    case hasCategoryAndPriorityProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((todoObj) => convertDbObjToResponseObj(todoObj))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const singleTodo = await db.get(getTodoQuery);
  response.send(convertDbObjToResponseObj(singleTodo));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const getDateQuery = `
            SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const dateQuery = await db.all(getDateQuery);
    //console.log(dateQuery);
    response.send(
      dateQuery.map((eachDateTodo) => convertDbObjToResponseObj(eachDateTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const insertTodoQuery = `INSERT INTO todo(id,todo,priority,category,status,due_date) 
                    VALUES(${id},'${todo}','${priority}','${category}','${status}','${newDueDate}');`;
          await db.run(insertTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body; //client request

  //get previous todo query
  const getPreviousTodo = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(getPreviousTodo);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery = null;

  switch (true) {
    //scenario1
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
                UPDATE todo 
                SET 
                    todo = '${todo}', 
                    priority = '${priority}', 
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE 
                    id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    //scenario2
    case requestBody.priority !== undefined:
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    todo = '${todo}', 
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}' 
                WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    //scenario3
    case requestBody.category !== undefined:
      if (
        category === "HOME" ||
        category === "LEARNING" ||
        category === "WORK"
      ) {
        updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    todo = '${todo}', 
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}' 
                WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //scenario4
    case requestBody.todo !== undefined:
      updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    todo = '${todo}', 
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}' 
                WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");

      break;

    //scenario5
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
                UPDATE 
                    todo 
                SET 
                    todo = '${todo}', 
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${newDueDate}' 
                WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
