import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Trash2,
  CalendarDays,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  FileText,
  X,
  BarChart3,
  Receipt,
  Download,
  Pencil,
  Save,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

import "./App.css";

const API_URL = "http://localhost:8080/api/expenses";

const CURRENCY = "₹";

function App() {

  // =====================================================
  // STATE
  // =====================================================

  const [expenses, setExpenses] = useState([]);

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState(null);

  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "Food",
    amount: "",
    date: "",
    description: "",
  });

  // =====================================================
  // GET ALL EXPENSES
  // =====================================================

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {

      const response = await axios.get(API_URL);

      setExpenses(response.data);

    } catch (error) {

      console.error(
        "Error fetching expenses:",
        error
      );

      alert(
        "Unable to load expenses from the backend."
      );

    }
  };

  // =====================================================
  // MONEY FORMAT
  // =====================================================

  const formatMoney = (amount) => {

    return (
      CURRENCY +
      Number(amount || 0).toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 0,
        }
      )
    );

  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const totalExpense = useMemo(() => {

    return expenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );

  }, [expenses]);


  const averageExpense = useMemo(() => {

    if (expenses.length === 0) {
      return 0;
    }

    return totalExpense / expenses.length;

  }, [expenses, totalExpense]);


  const highestExpense = useMemo(() => {

    if (expenses.length === 0) {
      return 0;
    }

    return Math.max(
      ...expenses.map((expense) =>
        Number(expense.amount || 0)
      )
    );

  }, [expenses]);

  // =====================================================
  // CATEGORY DATA
  // =====================================================

  const categoryData = useMemo(() => {

    const categories = {};

    expenses.forEach((expense) => {

      const category =
        expense.category || "Other";

      categories[category] =
        (categories[category] || 0) +
        Number(expense.amount || 0);

    });

    return Object.entries(categories).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

  }, [expenses]);


  const categoryColors = [
    "#8b5cf6",
    "#06b6d4",
    "#f59e0b",
    "#ef4444",
    "#22c55e",
    "#ec4899",
  ];

  // =====================================================
  // MONTHLY DATA (last 6 calendar months, year-aware so
  // expenses from different years never get merged together)
  // =====================================================

  const monthlyData = useMemo(() => {

    const now = new Date();

    const buckets = [];

    for (let i = 5; i >= 0; i--) {

      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString("en-US", {
          month: "short",
        }),
        expense: 0,
      });

    }

    expenses.forEach((expense) => {

      if (!expense.date) {
        return;
      }

      const date = new Date(expense.date);

      if (isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${date.getMonth()}`;

      const found = buckets.find(
        (item) => item.key === key
      );

      if (found) {

        found.expense += Number(
          expense.amount || 0
        );

      }

    });

    return buckets;

  }, [expenses]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredExpenses = useMemo(() => {

    const value =
      search.toLowerCase();

    return expenses.filter(
      (expense) => {

        return (

          (expense.title || "")
            .toLowerCase()
            .includes(value)

          ||

          (expense.category || "")
            .toLowerCase()
            .includes(value)

          ||

          (expense.description || "")
            .toLowerCase()
            .includes(value)

        );

      }
    );

  }, [expenses, search]);

  // =====================================================
  // CATEGORY ICON
  // =====================================================

  const getCategoryIcon = (category) => {

    switch (category) {

      case "Food":
        return <Utensils size={18} />;

      case "Transport":
        return <Car size={18} />;

      case "Shopping":
        return <ShoppingBag size={18} />;

      case "Bills":
        return <Home size={18} />;

      default:
        return <FileText size={18} />;

    }

  };

  // =====================================================
  // RESET ADD FORM
  // =====================================================

  const resetExpenseForm = () => {

    setNewExpense({
      title: "",
      category: "Food",
      amount: "",
      date: "",
      description: "",
    });

  };

  // =====================================================
  // ADD EXPENSE
  // =====================================================

  const addExpense = async (e) => {

    e.preventDefault();

    if (
      !newExpense.title ||
      !newExpense.amount ||
      !newExpense.date
    ) {

      alert(
        "Please fill Title, Amount and Date."
      );

      return;
    }

    try {

      const response =
        await axios.post(
          API_URL,
          {
            title: newExpense.title,
            amount: Number(
              newExpense.amount
            ),
            category:
              newExpense.category,
            date: newExpense.date,
            description:
              newExpense.description,
          }
        );

      setExpenses((prev) => [
        response.data,
        ...prev,
      ]);

      resetExpenseForm();

      setShowModal(false);

      alert(
        "Expense added successfully!"
      );

    } catch (error) {

      console.error(
        "Error adding expense:",
        error
      );

      alert(
        "Failed to add expense."
      );

    }

  };

  // =====================================================
  // DELETE EXPENSE
  // =====================================================

  const deleteExpense = async (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this expense?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await axios.delete(
        `${API_URL}/${id}`
      );

      setExpenses((prev) =>
        prev.filter(
          (expense) =>
            expense.id !== id
        )
      );

    } catch (error) {

      console.error(
        "Error deleting expense:",
        error
      );

      alert(
        "Failed to delete expense."
      );

    }

  };

  // =====================================================
  // EDIT EXPENSE
  // =====================================================

  const updateExpense = async (e) => {

    e.preventDefault();

    if (!editingExpense) {
      return;
    }

    try {

      const response =
        await axios.put(
          `${API_URL}/${editingExpense.id}`,
          {
            title:
              editingExpense.title,

            amount: Number(
              editingExpense.amount
            ),

            category:
              editingExpense.category,

            date:
              editingExpense.date,

            description:
              editingExpense.description,
          }
        );

      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id ===
          editingExpense.id
            ? response.data
            : expense
        )
      );

      setEditingExpense(null);

      alert(
        "Expense updated successfully!"
      );

    } catch (error) {

      console.error(
        "Error updating expense:",
        error
      );

      alert(
        "Failed to update expense."
      );

    }

  };

  // =====================================================
  // EXPORT CSV
  // =====================================================

  const exportReport = () => {

    if (expenses.length === 0) {

      alert(
        "There are no expenses to export."
      );

      return;
    }

    const headers = [
      "ID",
      "Title",
      "Amount",
      "Category",
      "Date",
      "Description",
    ];

    const rows = expenses.map(
      (expense) => [
        expense.id,
        expense.title,
        expense.amount,
        expense.category,
        expense.date,
        expense.description || "",
      ]
    );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "expense-report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  };

  // =====================================================
  // TRANSACTIONS TABLE
  // =====================================================

  const TransactionsTable = ({
    data,
    showSearch = true,
  }) => {

    return (

      <section className="card transactions">

        <div className="transaction-header">

          <div>

            <h3>
              Transactions
            </h3>

            <p>
              Your expenses
            </p>

          </div>

          {showSearch && (

            <div className="search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

          )}

        </div>


        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>
                  Expense
                </th>

                <th>
                  Category
                </th>

                <th>
                  Date
                </th>

                <th>
                  Description
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {data.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >

                    No expenses found.

                  </td>

                </tr>

              ) : (

                data.map(
                  (expense) => (

                    <tr
                      key={
                        expense.id
                      }
                    >

                      <td>

                        <div className="expense-name">

                          <div className="expense-icon">

                            {getCategoryIcon(
                              expense.category
                            )}

                          </div>

                          <strong>
                            {expense.title}
                          </strong>

                        </div>

                      </td>


                      <td>

                        <span className="category-badge">

                          {expense.category}

                        </span>

                      </td>


                      <td>
                        {expense.date}
                      </td>


                      <td>
                        {expense.description ||
                          "-"}
                      </td>


                      <td className="amount">

                        {formatMoney(
                          expense.amount
                        )}

                      </td>


                      <td>

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                          }}
                        >

                          <button
                            className="delete-button"
                            title="Edit"
                            onClick={() =>
                              setEditingExpense(
                                {
                                  ...expense,
                                }
                              )
                            }
                          >

                            <Pencil
                              size={16}
                            />

                          </button>


                          <button
                            className="delete-button"
                            title="Delete"
                            onClick={() =>
                              deleteExpense(
                                expense.id
                              )
                            }
                          >

                            <Trash2
                              size={17}
                            />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

    );

  };

  // =====================================================
  // DASHBOARD PAGE
  // =====================================================

  const DashboardPage = () => (

    <>

      <header className="header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Track and manage your expenses
          </p>

        </div>


        <button
          className="add-button"
          onClick={() => {

            resetExpenseForm();

            setShowModal(true);

          }}
        >

          <Plus size={20} />

          Add Expense

        </button>

      </header>


      {/* STAT CARDS */}

      <section className="stats">

        <div className="stat-card">

          <div className="stat-icon purple">

            <Wallet size={22} />

          </div>

          <div>

            <p>
              Total Expenses
            </p>

            <h2>
              {formatMoney(
                totalExpense
              )}
            </h2>

            <span className="positive">

              <TrendingUp
                size={14}
              />

              Total spending

            </span>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon red">

            <TrendingDown
              size={22}
            />

          </div>

          <div>

            <p>
              Highest Expense
            </p>

            <h2>
              {formatMoney(
                highestExpense
              )}
            </h2>

            <span>
              Single transaction
            </span>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon blue">

            <CalendarDays
              size={22}
            />

          </div>

          <div>

            <p>
              Transactions
            </p>

            <h2>
              {expenses.length}
            </h2>

            <span>
              Total transactions
            </span>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon green">

            <TrendingUp
              size={22}
            />

          </div>

          <div>

            <p>
              Average Expense
            </p>

            <h2>
              {formatMoney(
                Math.round(
                  averageExpense
                )
              )}
            </h2>

            <span>
              Per transaction
            </span>

          </div>

        </div>

      </section>


      {/* CHARTS */}

      <section className="charts">

        {/* AREA CHART */}

        <div className="card chart-card">

          <div className="card-header">

            <div>

              <h3>
                Monthly Expenses
              </h3>

              <p>
                Your spending over the last 6 months
              </p>

            </div>

          </div>


          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <AreaChart
              data={monthlyData}
            >

              <defs>

                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.35}
                  />

                  <stop
                    offset="100%"
                    stopColor="#8b5cf6"
                    stopOpacity={0}
                  />

                </linearGradient>

              </defs>


              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.15}
              />

              <XAxis
                dataKey="month"
              />

              <YAxis />

              <Tooltip />


              <Area
                type="monotone"
                dataKey="expense"
                stroke="#8b5cf6"
                fill="url(#expenseGradient)"
                strokeWidth={3}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>


        {/* PIE CHART */}

        <div className="card chart-card">

          <div className="card-header">

            <div>

              <h3>
                Expense by Category
              </h3>

              <p>
                Where your money goes
              </p>

            </div>

          </div>


          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <PieChart>

              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={55}
              >

                {categoryData.map(
                  (entry, index) => (

                    <Cell
                      key={index}
                      fill={
                        categoryColors[
                          index %
                            categoryColors.length
                        ]
                      }
                    />

                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>


          <div className="category-list">

            {categoryData.map(
              (item, index) => (

                <div
                  className="category-item"
                  key={item.name}
                >

                  <span
                    className="category-dot"
                    style={{
                      background:
                        categoryColors[
                          index %
                            categoryColors.length
                        ],
                    }}
                  />

                  <span>
                    {item.name}
                  </span>

                  <strong>
                    {formatMoney(
                      item.value
                    )}
                  </strong>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* BAR CHART */}

      <section className="card spending-chart">

        <div className="card-header">

          <div>

            <h3>
              Spending Overview
            </h3>

            <p>
              Monthly expense comparison
            </p>

          </div>

        </div>


        <ResponsiveContainer
          width="100%"
          height={280}
        >

          <BarChart
            data={monthlyData}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.15}
            />

            <XAxis
              dataKey="month"
            />

            <YAxis />

            <Tooltip />

            <Bar
              dataKey="expense"
              fill="#8b5cf6"
              radius={[
                6,
                6,
                0,
                0,
              ]}
            />

          </BarChart>

        </ResponsiveContainer>

      </section>


      {/* RECENT TRANSACTIONS */}

      <TransactionsTable
        data={filteredExpenses.slice(
          0,
          5
        )}
      />

    </>

  );

  // =====================================================
  // TRANSACTIONS PAGE
  // =====================================================

  const TransactionsPage = () => (

    <>

      <header className="header">

        <div>

          <h1>
            Transactions
          </h1>

          <p>
            View and manage all your expenses
          </p>

        </div>


        <button
          className="add-button"
          onClick={() => {

            resetExpenseForm();

            setShowModal(true);

          }}
        >

          <Plus size={20} />

          Add Expense

        </button>

      </header>


      <TransactionsTable
        data={
          filteredExpenses
        }
      />

    </>

  );

  // =====================================================
  // ANALYTICS PAGE
  // =====================================================

  const AnalyticsPage = () => (

    <>

      <header className="header">

        <div>

          <h1>
            Analytics
          </h1>

          <p>
            Understand your spending patterns
          </p>

        </div>

      </header>


      <section className="stats">

        <div className="stat-card">

          <div className="stat-icon purple">

            <Wallet size={22} />

          </div>

          <div>

            <p>
              Total Spending
            </p>

            <h2>
              {formatMoney(
                totalExpense
              )}
            </h2>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon red">

            <TrendingDown
              size={22}
            />

          </div>

          <div>

            <p>
              Highest Expense
            </p>

            <h2>
              {formatMoney(
                highestExpense
              )}
            </h2>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon blue">

            <BarChart3
              size={22}
            />

          </div>

          <div>

            <p>
              Transactions
            </p>

            <h2>
              {expenses.length}
            </h2>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon green">

            <TrendingUp
              size={22}
            />

          </div>

          <div>

            <p>
              Average
            </p>

            <h2>
              {formatMoney(
                Math.round(
                  averageExpense
                )
              )}
            </h2>

          </div>

        </div>

      </section>


      <section className="charts">

        {/* CATEGORY ANALYTICS */}

        <div className="card chart-card">

          <div className="card-header">

            <div>

              <h3>
                Spending by Category
              </h3>

              <p>
                Category distribution
              </p>

            </div>

          </div>


          <ResponsiveContainer
            width="100%"
            height={350}
          >

            <PieChart>

              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                innerRadius={65}
              >

                {categoryData.map(
                  (entry, index) => (

                    <Cell
                      key={index}
                      fill={
                        categoryColors[
                          index %
                            categoryColors.length
                        ]
                      }
                    />

                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>


        {/* MONTHLY ANALYTICS */}

        <div className="card chart-card">

          <div className="card-header">

            <div>

              <h3>
                Monthly Spending
              </h3>

              <p>
                Expense trend
              </p>

            </div>

          </div>


          <ResponsiveContainer
            width="100%"
            height={350}
          >

            <BarChart
              data={monthlyData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.15}
              />

              <XAxis
                dataKey="month"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="expense"
                fill="#8b5cf6"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </section>

    </>

  );

  // =====================================================
  // REPORTS PAGE
  // =====================================================

  const ReportsPage = () => (

    <>

      <header className="header">

        <div>

          <h1>
            Reports
          </h1>

          <p>
            View and export your expense report
          </p>

        </div>


        <button
          className="add-button"
          onClick={exportReport}
        >

          <Download size={20} />

          Export CSV

        </button>

      </header>


      <section className="stats">

        <div className="stat-card">

          <div className="stat-icon purple">

            <Wallet size={22} />

          </div>

          <div>

            <p>
              Total Expenses
            </p>

            <h2>
              {formatMoney(
                totalExpense
              )}
            </h2>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon blue">

            <Receipt size={22} />

          </div>

          <div>

            <p>
              Transactions
            </p>

            <h2>
              {expenses.length}
            </h2>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon red">

            <TrendingDown
              size={22}
            />

          </div>

          <div>

            <p>
              Highest Expense
            </p>

            <h2>
              {formatMoney(
                highestExpense
              )}
            </h2>

          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon green">

            <TrendingUp
              size={22}
            />

          </div>

          <div>

            <p>
              Average Expense
            </p>

            <h2>
              {formatMoney(
                Math.round(
                  averageExpense
                )
              )}
            </h2>

          </div>

        </div>

      </section>


      <section className="card transactions">

        <div className="transaction-header">

          <div>

            <h3>
              Expense Report
            </h3>

            <p>
              Complete expense history
            </p>

          </div>

        </div>


        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>
                  Title
                </th>

                <th>
                  Category
                </th>

                <th>
                  Date
                </th>

                <th>
                  Amount
                </th>

              </tr>

            </thead>


            <tbody>

              {expenses.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >

                    No expenses available.

                  </td>

                </tr>

              ) : (

                expenses.map(
                  (expense) => (

                    <tr
                      key={
                        expense.id
                      }
                    >

                      <td>
                        {expense.title}
                      </td>

                      <td>
                        {expense.category}
                      </td>

                      <td>
                        {expense.date}
                      </td>

                      <td className="amount">

                        {formatMoney(
                          expense.amount
                        )}

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

    </>

  );

  // =====================================================
  // PAGE SWITCHER
  // =====================================================

  const renderPage = () => {

    switch (activePage) {

      case "Transactions":

        return (
          <TransactionsPage />
        );

      case "Analytics":

        return (
          <AnalyticsPage />
        );

      case "Reports":

        return (
          <ReportsPage />
        );

      default:

        return (
          <DashboardPage />
        );

    }

  };

  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <div className="dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">

          <Wallet size={28} />

          <span>

            Expense

            <span className="logo-highlight">
              Track
            </span>

          </span>

        </div>


        <nav>

          <a
            className={
              activePage ===
              "Dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Dashboard"
              )
            }
          >

            <Wallet size={18} />

            Dashboard

          </a>


          <a
            className={
              activePage ===
              "Transactions"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Transactions"
              )
            }
          >

            <Receipt size={18} />

            Transactions

          </a>


          <a
            className={
              activePage ===
              "Analytics"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Analytics"
              )
            }
          >

            <BarChart3 size={18} />

            Analytics

          </a>


          <a
            className={
              activePage ===
              "Reports"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Reports"
              )
            }
          >

            <FileText size={18} />

            Reports

          </a>

        </nav>


        <div className="sidebar-bottom">

          <p>
            Expense Tracker
          </p>

          <small>
            Manage your money better
          </small>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main">

        {renderPage()}

      </main>


      {/* =================================================
          ADD EXPENSE MODAL
      ================================================= */}

      {showModal && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Add Expense
              </h2>


              <button
                onClick={() => {

                  setShowModal(
                    false
                  );

                  resetExpenseForm();

                }}
                className="close-button"
              >

                <X size={20} />

              </button>

            </div>


            <form
              onSubmit={addExpense}
            >

              <label>

                Title

                <input
                  type="text"
                  placeholder="e.g. Grocery"
                  value={
                    newExpense.title
                  }
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      title:
                        e.target.value,
                    })
                  }
                />

              </label>


              <label>

                Amount

                <input
                  type="number"
                  placeholder="Enter amount"
                  value={
                    newExpense.amount
                  }
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      amount:
                        e.target.value,
                    })
                  }
                />

              </label>


              <label>

                Category

                <select
                  value={
                    newExpense.category
                  }
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      category:
                        e.target.value,
                    })
                  }
                >

                  <option>
                    Food
                  </option>

                  <option>
                    Transport
                  </option>

                  <option>
                    Shopping
                  </option>

                  <option>
                    Bills
                  </option>

                  <option>
                    Entertainment
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </label>


              <label>

                Date

                <input
                  type="date"
                  value={
                    newExpense.date
                  }
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      date:
                        e.target.value,
                    })
                  }
                />

              </label>


              <label>

                Description

                <textarea
                  placeholder="Description"
                  value={
                    newExpense.description
                  }
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description:
                        e.target.value,
                    })
                  }
                />

              </label>


              <button
                type="submit"
                className="save-button"
              >

                Add Expense

              </button>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          EDIT EXPENSE MODAL
      ================================================= */}

      {editingExpense && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Edit Expense
              </h2>


              <button
                onClick={() =>
                  setEditingExpense(
                    null
                  )
                }
                className="close-button"
              >

                <X size={20} />

              </button>

            </div>


            <form
              onSubmit={
                updateExpense
              }
            >

              <label>

                Title

                <input
                  type="text"
                  value={
                    editingExpense.title
                  }
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      title:
                        e.target.value,
                    })
                  }
                />

              </label>


              <label>

                Amount

                <input
                  type="number"
                  value={
                    editingExpense.amount
                  }
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      amount:
                        e.target.value,
                    })
                  }
                />

              </label>


              <label>

                Category

                <select
                  value={
                    editingExpense.category
                  }
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      category:
                        e.target.value,
                    })
                  }
                >

                  <option>
                    Food
                  </option>

                  <option>
                    Transport
                  </option>

                  <option>
                    Shopping
                  </option>

                  <option>
                    Bills
                  </option>

                  <option>
                    Entertainment
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </label>


              <label>

                Date

                <input
                  type="date"
                  value={
                    editingExpense.date
                  }
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      date:
                        e.target.value,
                    })
                  }
                />

              </label>


              <label>

                Description

                <textarea
                  value={
                    editingExpense.description ||
                    ""
                  }
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      description:
                        e.target.value,
                    })
                  }
                />

              </label>


              <button
                type="submit"
                className="save-button"
              >

                <Save size={18} />

                Update Expense

              </button>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}

export default App;