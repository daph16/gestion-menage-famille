/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type UrgencyLevel = 'haute' | 'moyenne' | 'basse';

interface Task {
    id: string;
    name: string;
    assignedTo: string;
    isRecurring: boolean;
    isCompleted: boolean;
    createdAt: number;
    dueDate?: string;
    urgency?: UrgencyLevel;
}

// !!! IMPORTANT ADMIN CONFIGURATION !!!
// Remplacez la valeur ci-dessous par VOTRE adresse e-mail Google pour l'accès admin.
const ADMIN_EMAIL = "daphnebertrand4@gmail.com";
const DEFAULT_ADMIN_EMAIL_PLACEHOLDER = "VOTRE_ADRESSE_EMAIL_GOOGLE_ICI@example.com";

const users: string[] = ["Daphné", "Xavier", "Nathan", "Elliot", "Basile"];
let tasks: Task[] = [];
let currentView: string = 'homeWeekView'; // Default view
let isAdmin: boolean = false;

// For Home Week View
let currentWeekStartDate: Date = getStartOfWeek(new Date());

// For Daily Plan View
let selectedDateForDailyPlan: string = new Date().toISOString().split('T')[0];
// For User Tasks View
let selectedUserForTodoList: string = '';


// DOM Elements
const taskForm = document.getElementById('addTaskForm') as HTMLFormElement;
const taskNameInput = document.getElementById('taskName') as HTMLInputElement;
const assignedToSelect = document.getElementById('assignedTo') as HTMLSelectElement;
const dueDateInput = document.getElementById('dueDate') as HTMLInputElement;
const urgencySelect = document.getElementById('urgency') as HTMLSelectElement;
const isRecurringCheckbox = document.getElementById('isRecurring') as HTMLInputElement;

// View specific lists
const taskListDiv = document.getElementById('taskList') as HTMLDivElement; // For dashboard
const dailyTaskListDiv = document.getElementById('dailyTaskList') as HTMLDivElement;
const userSpecificTaskListDiv = document.getElementById('userSpecificTaskList') as HTMLDivElement;
const homeWeekViewContentDiv = document.getElementById('homeWeekViewContent') as HTMLDivElement;

// Input/Control elements for views
const dailyPlanDateInput = document.getElementById('dailyPlanDate') as HTMLInputElement;
const userSelectForTodo = document.getElementById('userSelectForTodo') as HTMLSelectElement;

// Tab navigation
const tabButtons = document.querySelectorAll('.tab-button');
const viewSections = document.querySelectorAll('.view-section');
const dashboardTab = document.getElementById('dashboardTab') as HTMLButtonElement;

// Admin
const adminLoginButton = document.getElementById('adminLoginButton') as HTMLButtonElement;

// Home Week View Navigation
const prevWeekButton = document.getElementById('prevWeekButton') as HTMLButtonElement;
const nextWeekButton = document.getElementById('nextWeekButton') as HTMLButtonElement;
const currentWeekDisplay = document.getElementById('currentWeekDisplay') as HTMLSpanElement;
const noTasksWeekMessage = document.getElementById('noTasksWeekMessage') as HTMLParagraphElement;

// No tasks messages
const noTasksMessageDashboard = document.getElementById('noTasksDashboardMessage') as HTMLParagraphElement;
const noTasksMessageDaily = document.getElementById('noTasksDailyMessage') as HTMLParagraphElement;
const noTasksMessageUser = document.getElementById('noTasksUserMessage') as HTMLParagraphElement;


// --- Date Helper Functions ---
function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateString?: string | Date): string {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    // Adjust for timezone offset if dateString was a YYYY-MM-DD string (interpreted as UTC)
    if (typeof dateString === 'string' && dateString.indexOf('T') === -1) {
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}


// --- Admin Functions ---
function checkAdminStatus(): void {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        isAdmin = true;
        if (dashboardTab) dashboardTab.style.display = 'inline-block'; // Or 'flex' or 'block' depending on styling
        adminLoginButton.textContent = 'Admin (Connecté)';
        adminLoginButton.setAttribute('aria-pressed', 'true');
    } else {
        isAdmin = false;
        if (dashboardTab) dashboardTab.style.display = 'none';
        adminLoginButton.textContent = 'Connexion Admin';
        adminLoginButton.setAttribute('aria-pressed', 'false');
    }
}

function handleAdminLogin(): void {
    if (isAdmin) {
        if (confirm("Voulez-vous vous déconnecter du mode admin ?")) {
            sessionStorage.removeItem('isAdminAuthenticated');
            isAdmin = false;
            if (dashboardTab) dashboardTab.style.display = 'none';
            adminLoginButton.textContent = 'Connexion Admin';
            adminLoginButton.setAttribute('aria-pressed', 'false');
            if (currentView === 'dashboard') showView('homeWeekView'); // Redirect if on dashboard
        }
        return;
    }

    const email = prompt("Veuillez entrer l'e-mail administrateur :");
    if (email === ADMIN_EMAIL) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        isAdmin = true;
        if (dashboardTab) dashboardTab.style.display = 'inline-block';
        adminLoginButton.textContent = 'Admin (Connecté)';
        adminLoginButton.setAttribute('aria-pressed', 'true');
        alert("Connexion admin réussie !");
        showView('dashboard'); // Optionally navigate to dashboard
    } else if (email) { // if email is not null (i.e., user didn't cancel)
        alert("E-mail incorrect.");
    }
}


// Populate user dropdowns
function populateUserDropdowns(): void {
    [assignedToSelect, userSelectForTodo].forEach(selectElement => {
        if (!selectElement) return;
        
        const currentVal = selectElement.value; // Preserve current selection if any
        selectElement.innerHTML = ''; // Clear existing options

        if (selectElement.id === 'assignedTo') {
            const placeholder = document.createElement('option');
            placeholder.value = "";
            placeholder.textContent = "Sélectionner une personne";
            placeholder.disabled = true;
            placeholder.selected = !currentVal; // Select if no current value
            selectElement.appendChild(placeholder);
        } else { // For filter dropdowns
            const allOption = document.createElement('option');
            allOption.value = "";
            allOption.textContent = "Tous";
            selectElement.appendChild(allOption);
        }

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            selectElement.appendChild(option);
        });
        if(currentVal) selectElement.value = currentVal; // Restore selection
    });
}


// Render a single task item (generic, used by multiple views)
function createTaskElement(task: Task, viewContext: 'dashboard' | 'daily' | 'user'): HTMLDivElement {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.classList.toggle('completed', task.isCompleted);
    if (task.urgency) {
        taskItem.classList.add(`urgency-${task.urgency}`);
    }
    taskItem.setAttribute('data-task-id', task.id);
    taskItem.setAttribute('role', 'listitem');
    
    let ariaLabel = `${task.name}, assigné à ${task.assignedTo}`;
    if (task.dueDate) ariaLabel += `, échéance le ${formatDisplayDate(task.dueDate)}`;
    if (task.urgency) ariaLabel += `, urgence ${task.urgency}`;
    if (task.isCompleted) ariaLabel += ', terminée';
    taskItem.setAttribute('aria-label', ariaLabel);

    const taskDetails = document.createElement('div');
    taskDetails.className = 'task-details';

    const taskNameElement = document.createElement('span');
    taskNameElement.className = 'task-name';
    taskNameElement.textContent = task.name;
    taskDetails.appendChild(taskNameElement);

    const taskAssignmentElement = document.createElement('span');
    taskAssignmentElement.className = 'task-assignment';
    taskAssignmentElement.innerHTML = `Assigné à : <strong>${task.assignedTo}</strong>`;
    taskDetails.appendChild(taskAssignmentElement);

    if (task.dueDate) {
        const dueDateElement = document.createElement('span');
        dueDateElement.className = 'task-due-date';
        dueDateElement.textContent = `Échéance : ${formatDisplayDate(task.dueDate)}`;
        taskDetails.appendChild(dueDateElement);
    }

    if (task.urgency) {
        const urgencyElement = document.createElement('span');
        urgencyElement.className = 'task-urgency-label';
        urgencyElement.innerHTML = `Urgence : <strong>${task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1)}</strong>`;
        taskDetails.appendChild(urgencyElement);
    }

    if (task.isRecurring) {
        const taskRecurrenceElement = document.createElement('span');
        taskRecurrenceElement.className = 'task-recurrence';
        taskRecurrenceElement.textContent = '🔁 Récurrente';
        taskDetails.appendChild(taskRecurrenceElement);
    }

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const completeCheckbox = document.createElement('input');
    completeCheckbox.type = 'checkbox';
    completeCheckbox.checked = task.isCompleted;
    completeCheckbox.setAttribute('aria-label', `Marquer ${task.name} comme ${task.isCompleted ? 'non terminée' : 'terminée'}`);
    completeCheckbox.id = `complete-task-${task.id}`;
    
    const completeLabel = document.createElement('label');
    completeLabel.setAttribute('for', completeCheckbox.id);
    completeLabel.className = 'sr-only'; // For screen readers only
    completeLabel.textContent = `Marquer ${task.name} comme ${task.isCompleted ? 'non terminée' : 'terminée'}`;

    completeCheckbox.addEventListener('change', () => {
        toggleTaskCompletion(task.id);
    });
    taskActions.appendChild(completeCheckbox);
    taskActions.appendChild(completeLabel);


    // Delete button only on dashboard for admins or based on permissions if complex
    if (viewContext === 'dashboard' && isAdmin) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger';
        deleteButton.textContent = 'Supprimer';
        deleteButton.setAttribute('aria-label', `Supprimer la tâche ${task.name}`);
        deleteButton.addEventListener('click', () => {
            deleteTask(task.id);
        });
        taskActions.appendChild(deleteButton);
    }

    taskItem.appendChild(taskDetails);
    taskItem.appendChild(taskActions);
    return taskItem;
}

// --- Render Functions for Each View ---

// Render tasks for the Home Week View
function renderHomeWeekView(): void {
    if (!homeWeekViewContentDiv || !currentWeekDisplay) return;
    homeWeekViewContentDiv.innerHTML = '';

    const weekStart = currentWeekStartDate;
    const weekEnd = addDays(weekStart, 6);
    currentWeekDisplay.textContent = `Semaine du ${formatDisplayDate(weekStart)} au ${formatDisplayDate(weekEnd)}`;

    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    let tasksFoundInWeek = false;

    for (let i = 0; i < 7; i++) {
        const dayDate = addDays(weekStart, i);
        const dayDateISO = formatDateISO(dayDate);

        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        
        const dayTitle = document.createElement('h3');
        dayTitle.textContent = `${daysOfWeek[i]} (${formatDisplayDate(dayDate).substring(0,5)})`; // DD/MM
        dayColumn.appendChild(dayTitle);

        const dailyTasksContainer = document.createElement('div');
        dailyTasksContainer.className = 'task-list-mini';
        dailyTasksContainer.setAttribute('aria-labelledby', `day-title-${i}`);
        dayTitle.id = `day-title-${i}`;
        
        const tasksForDay = tasks
            .filter(task => task.dueDate === dayDateISO && !task.isCompleted)
            .sort((a,b) => { // Sort by urgency then creation
                const urgencyOrder = { 'haute': 1, 'moyenne': 2, 'basse': 3 };
                const urgencyA = a.urgency ? urgencyOrder[a.urgency] : 3;
                const urgencyB = b.urgency ? urgencyOrder[b.urgency] : 3;
                if (urgencyA !== urgencyB) return urgencyA - urgencyB;
                return a.createdAt - b.createdAt;
            });
        
        const completedTasksForDay = tasks
            .filter(task => task.dueDate === dayDateISO && task.isCompleted)
            .sort((a,b) => a.createdAt - b.createdAt);

        const allTasksForDay = [...tasksForDay, ...completedTasksForDay];

        if (allTasksForDay.length > 0) {
            tasksFoundInWeek = true;
            allTasksForDay.forEach(task => {
                const taskMiniElement = document.createElement('div');
                taskMiniElement.className = 'task-item-mini';
                if(task.isCompleted) taskMiniElement.style.opacity = '0.6';
                if(task.urgency) taskMiniElement.classList.add(`urgency-${task.urgency}`);
                taskMiniElement.setAttribute('role', 'listitem');

                const nameEl = document.createElement('span');
                nameEl.className = 'task-name-mini';
                nameEl.textContent = task.name;
                if(task.isCompleted) nameEl.style.textDecoration = 'line-through';
                taskMiniElement.appendChild(nameEl);

                const assigneeEl = document.createElement('span');
                assigneeEl.className = 'task-assignee-mini';
                assigneeEl.textContent = `Pour: ${task.assignedTo}`;
                taskMiniElement.appendChild(assigneeEl);
                dailyTasksContainer.appendChild(taskMiniElement);
            });
        } else {
            const noTasksDayMessage = document.createElement('p');
            noTasksDayMessage.className = 'no-tasks-day';
            noTasksDayMessage.textContent = 'Aucune tâche.';
            noTasksDayMessage.setAttribute('aria-live', 'polite');
            dailyTasksContainer.appendChild(noTasksDayMessage);
        }
        dayColumn.appendChild(dailyTasksContainer);
        homeWeekViewContentDiv.appendChild(dayColumn);
    }
    if (noTasksWeekMessage) {
        noTasksWeekMessage.style.display = tasksFoundInWeek ? 'none' : 'block';
        noTasksWeekMessage.setAttribute('aria-live', 'polite');
    }
}


// Render tasks for the Dashboard view
function renderDashboardTasks(): void {
    if(!taskListDiv) return;
    taskListDiv.innerHTML = '';
    const dashboardTasks = tasks.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        const dueDateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dueDateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (dueDateA !== dueDateB) return dueDateA - dueDateB;
        return b.createdAt - a.createdAt;
    });

    if (dashboardTasks.length === 0) {
        if (noTasksMessageDashboard) {
            noTasksMessageDashboard.style.display = 'block';
            noTasksMessageDashboard.setAttribute('aria-live', 'polite');
        }
    } else {
        if (noTasksMessageDashboard) noTasksMessageDashboard.style.display = 'none';
        const listElement = document.createElement('ul');
        listElement.className = 'task-list-container';
        listElement.setAttribute('aria-label', 'Liste des tâches du dashboard');
        dashboardTasks.forEach(task => listElement.appendChild(createTaskElement(task, 'dashboard')));
        taskListDiv.appendChild(listElement);
    }
}

// Render tasks for the Daily Plan view
function renderDailyPlanTasks(): void {
    if (!dailyTaskListDiv) return;
    dailyTaskListDiv.innerHTML = '';
    const filteredTasks = tasks.filter(task => task.dueDate === selectedDateForDailyPlan && !task.isCompleted);
    
    filteredTasks.sort((a, b) => {
        const urgencyOrder = { 'haute': 1, 'moyenne': 2, 'basse': 3 };
        const urgencyA = a.urgency ? urgencyOrder[a.urgency] : 3;
        const urgencyB = b.urgency ? urgencyOrder[b.urgency] : 3;
        if (urgencyA !== urgencyB) return urgencyA - urgencyB;
        return a.createdAt - b.createdAt;
    });
    
    const completedTasksForDay = tasks.filter(task => task.dueDate === selectedDateForDailyPlan && task.isCompleted)
                                     .sort((a,b) => a.createdAt - b.createdAt);
    
    const tasksToDisplay = [...filteredTasks, ...completedTasksForDay];

    if (tasksToDisplay.length === 0) {
        if (noTasksMessageDaily) {
            noTasksMessageDaily.style.display = 'block';
            noTasksMessageDaily.setAttribute('aria-live', 'polite');
        }
    } else {
        if (noTasksMessageDaily) noTasksMessageDaily.style.display = 'none';
        const listElement = document.createElement('ul');
        listElement.className = 'task-list-container';
        listElement.setAttribute('aria-label', `Tâches pour le ${formatDisplayDate(selectedDateForDailyPlan)}`);
        tasksToDisplay.forEach(task => listElement.appendChild(createTaskElement(task, 'daily')));
        dailyTaskListDiv.appendChild(listElement);
    }
}

// Render tasks for the User-Specific To-Do List view
function renderUserSpecificTasks(): void {
    if (!userSpecificTaskListDiv) return;
    userSpecificTaskListDiv.innerHTML = '';
    if (!selectedUserForTodoList) {
         if (noTasksMessageUser) {
            noTasksMessageUser.textContent = "Sélectionnez un utilisateur pour voir ses tâches.";
            noTasksMessageUser.style.display = 'block';
            noTasksMessageUser.setAttribute('aria-live', 'polite');
        }
        return;
    }

    const filteredTasks = tasks.filter(task => task.assignedTo === selectedUserForTodoList);
     filteredTasks.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        const dueDateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dueDateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (dueDateA !== dueDateB) return dueDateA - dueDateB;
        const urgencyOrder = { 'haute': 1, 'moyenne': 2, 'basse': 3 };
        const urgencyA = a.urgency ? urgencyOrder[a.urgency] : 3;
        const urgencyB = b.urgency ? urgencyOrder[b.urgency] : 3;
        if (urgencyA !== urgencyB) return urgencyA - urgencyB;
        return b.createdAt - a.createdAt;
    });

    if (filteredTasks.length === 0) {
        if (noTasksMessageUser) {
            noTasksMessageUser.textContent = `Aucune tâche assignée à ${selectedUserForTodoList}.`;
            noTasksMessageUser.style.display = 'block';
            noTasksMessageUser.setAttribute('aria-live', 'polite');
        }
    } else {
        if (noTasksMessageUser) noTasksMessageUser.style.display = 'none';
        const listElement = document.createElement('ul');
        listElement.className = 'task-list-container';
        listElement.setAttribute('aria-label', `Tâches assignées à ${selectedUserForTodoList}`);
        filteredTasks.forEach(task => listElement.appendChild(createTaskElement(task, 'user')));
        userSpecificTaskListDiv.appendChild(listElement);
    }
}


// Switch between views
function showView(viewId: string): void {
    if (viewId === 'dashboard' && !isAdmin) {
        alert("Accès réservé à l'administrateur. Veuillez vous connecter via le bouton 'Admin'.");
        // Revert to the current active tab or default to home if dashboard was attempted illicitly
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab && activeTab.getAttribute('data-view') !== 'dashboard') {
             currentView = activeTab.getAttribute('data-view') || 'homeWeekView';
        } else {
            currentView = 'homeWeekView';
        }
    } else {
      currentView = viewId;
    }

    viewSections.forEach(section => {
        const sectionEl = section as HTMLElement;
        const isActiveSection = sectionEl.id === `${currentView}Section`;
        sectionEl.style.display = isActiveSection ? 'block' : 'none';
        sectionEl.classList.toggle('active-section', isActiveSection);
        sectionEl.setAttribute('aria-hidden', (!isActiveSection).toString());
    });
    tabButtons.forEach(button => {
        const btnEl = button as HTMLButtonElement;
        const isActiveTab = btnEl.getAttribute('data-view') === currentView;
        btnEl.classList.toggle('active', isActiveTab);
        btnEl.setAttribute('aria-selected', isActiveTab.toString());
    });

    // Trigger render for the activated view
    if (currentView === 'homeWeekView') renderHomeWeekView();
    else if (currentView === 'dashboard' && isAdmin) renderDashboardTasks();
    else if (currentView === 'dailyPlan') renderDailyPlanTasks();
    else if (currentView === 'userTasks') renderUserSpecificTasks();
    // 'rules' section is static HTML

    const currentViewSection = document.getElementById(`${currentView}Section`);
    if(currentViewSection) {
        const firstFocusableElement = currentViewSection.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }
    }
}

// Add a new task (Admin function via Dashboard)
function addTask(event: SubmitEvent): void {
    event.preventDefault();
    if (!isAdmin) {
        alert("Action réservée à l'administrateur.");
        return;
    }

    const taskName = taskNameInput.value.trim();
    const assignedTo = assignedToSelect.value;
    const dueDate = dueDateInput.value;
    const urgency = urgencySelect.value as UrgencyLevel;
    const isRecurring = isRecurringCheckbox.checked;

    if (!taskName || !assignedTo || !dueDate) {
        alert("Veuillez remplir le nom, assigner une personne et spécifier une date d'échéance.");
        return;
    }
     if ((ADMIN_EMAIL as string) === DEFAULT_ADMIN_EMAIL_PLACEHOLDER) {
        alert("Pour des raisons de sécurité, l'ajout de tâche est désactivé tant que l'adresse e-mail admin par défaut n'a pas été changée dans le code source (index.tsx).");
        return;
    }


    const newTask: Task = {
        id: Date.now().toString(),
        name: taskName,
        assignedTo: assignedTo,
        isRecurring: isRecurring,
        isCompleted: false,
        createdAt: Date.now(),
        dueDate: dueDate,
        urgency: urgency
    };

    tasks.push(newTask);
    saveTasks();
    renderDashboardTasks(); // Always re-render dashboard as it's an admin action
    taskForm.reset();
    assignedToSelect.value = ""; // Reset select explicitly
    dueDateInput.value = ''; 
    urgencySelect.value = 'moyenne';
    taskNameInput.focus();
}

// Toggle task completion status
function toggleTaskCompletion(taskId: string): void {
    let taskChanged: Task | undefined;
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            taskChanged = { ...task, isCompleted: !task.isCompleted };
            return taskChanged;
        }
        return task;
    });
    saveTasks();
    
    // Announce the change
    if (taskChanged) {
        const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
        if (statusMessage) {
            statusMessage.textContent = `Tâche "${taskChanged.name}" marquée comme ${taskChanged.isCompleted ? 'terminée' : 'non terminée'}.`;
            // Clear message after a few seconds
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 3000);
        }
    }

    // Re-render appropriate view
    if (currentView === 'homeWeekView') renderHomeWeekView();
    else if (currentView === 'dashboard' && isAdmin) renderDashboardTasks();
    else if (currentView === 'dailyPlan') renderDailyPlanTasks();
    else if (currentView === 'userTasks') renderUserSpecificTasks();
}

// Delete a task (Admin function via Dashboard)
function deleteTask(taskId: string): void {
    if (!isAdmin) {
        alert("Action réservée à l'administrateur.");
        return;
    }
    const taskToDelete = tasks.find(task => task.id === taskId);
    if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderDashboardTasks(); // Always re-render dashboard
        if(taskToDelete){
            const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
            if (statusMessage) {
                statusMessage.textContent = `Tâche "${taskToDelete.name}" supprimée.`;
                setTimeout(() => { statusMessage.textContent = ''; }, 3000);
            }
        }
    }
}

// Save tasks to localStorage
function saveTasks(): void {
    localStorage.setItem('choreTasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks(): void {
    const storedTasks = localStorage.getItem('choreTasks');
    if (storedTasks) {
        try {
            const parsedTasks = JSON.parse(storedTasks) as Task[];
            // Basic validation for parsed tasks
            if (Array.isArray(parsedTasks)) {
                 tasks = parsedTasks.map(task => ({
                    ...task,
                    id: task.id || Date.now().toString() + Math.random().toString(), // Ensure ID exists
                    name: task.name || "Tâche sans nom",
                    assignedTo: task.assignedTo || users[0], // Default to first user if unassigned
                    isRecurring: typeof task.isRecurring === 'boolean' ? task.isRecurring : false,
                    isCompleted: typeof task.isCompleted === 'boolean' ? task.isCompleted : false,
                    createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
                    dueDate: task.dueDate || undefined, 
                    urgency: task.urgency || 'moyenne' 
                }));
            } else {
                tasks = []; // Fallback to empty array if stored data is not an array
            }
        } catch (error) {
            console.error("Erreur lors du chargement des tâches depuis localStorage:", error);
            tasks = []; // Fallback in case of parsing error
        }
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    if ((ADMIN_EMAIL as string) === DEFAULT_ADMIN_EMAIL_PLACEHOLDER) {
        const adminWarning = document.createElement('div');
        adminWarning.id = 'adminConfigWarning';
        adminWarning.className = 'admin-warning';
        adminWarning.textContent = "Bienvenue ! Pensez à configurer votre adresse e-mail admin dans le fichier index.tsx pour activer toutes les fonctionnalités d'administration.";
        adminWarning.setAttribute('role', 'alert');
        document.body.insertBefore(adminWarning, document.body.firstChild);
    }

    checkAdminStatus();
    populateUserDropdowns();
    loadTasks();
    
    if(dailyPlanDateInput) dailyPlanDateInput.value = selectedDateForDailyPlan;
    if(userSelectForTodo) userSelectForTodo.value = selectedUserForTodoList;

    // Event listeners for tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewId = button.getAttribute('data-view');
            if (viewId) showView(viewId);
        });
    });

    // Event listeners for dynamic view updates
    if(dailyPlanDateInput) {
        dailyPlanDateInput.addEventListener('change', (e) => {
            selectedDateForDailyPlan = (e.target as HTMLInputElement).value;
            if(currentView === 'dailyPlan') renderDailyPlanTasks();
        });
    }
    if(userSelectForTodo) {
        userSelectForTodo.addEventListener('change', (e) => {
            selectedUserForTodoList = (e.target as HTMLSelectElement).value;
            if(currentView === 'userTasks') renderUserSpecificTasks();
        });
    }

    if (taskForm) { // Add listener regardless of admin, but addTask checks admin status
        taskForm.addEventListener('submit', addTask);
    }


    if (adminLoginButton) adminLoginButton.addEventListener('click', handleAdminLogin);

    // Home Week View Navigation
    if(prevWeekButton) {
        prevWeekButton.addEventListener('click', () => {
            currentWeekStartDate = addDays(currentWeekStartDate, -7);
            renderHomeWeekView();
        });
    }
    if(nextWeekButton) {
        nextWeekButton.addEventListener('click', () => {
            currentWeekStartDate = addDays(currentWeekStartDate, 7);
            renderHomeWeekView();
        });
    }
    
    showView(currentView); // Initial render based on default view
    
    // Initial focus for admin on dashboard
    if (taskNameInput && currentView === 'dashboard' && isAdmin) {
         setTimeout(() => taskNameInput.focus(), 0); // Timeout to ensure section is visible
    }
});

// Ensure that if admin logs out and they are on dashboard, they are redirected.
window.addEventListener('storage', (event) => {
    if (event.key === 'isAdminAuthenticated' && event.newValue === null) {
        // Admin logged out from another tab/window
        checkAdminStatus(); // Update UI
        if (currentView === 'dashboard' && !isAdmin) {
            showView('homeWeekView');
        }
    }
});

// Add a global status message div for ARIA live region
const statusMessageDiv = document.createElement('div');
statusMessageDiv.id = 'statusMessage';
statusMessageDiv.className = 'status-message sr-only'; // sr-only initially, shown via JS
statusMessageDiv.setAttribute('aria-live', 'assertive');
statusMessageDiv.setAttribute('aria-atomic', 'true');
document.body.appendChild(statusMessageDiv);
