// Estado da aplicação
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
console.log('Tarefas carregadas:', tasks); // Debug
let currentFilter = 'all';

// Elementos DOM
const taskInput = document.getElementById('taskInput');
const taskPriority = document.getElementById('taskPriority');
const addTaskBtn = document.getElementById('addTask');
const taskList = document.getElementById('taskList');
const clearAllBtn = document.getElementById('clearAll');
const filterBtns = document.querySelectorAll('.filter-btn');

// Função para criar uma nova tarefa
function createTask(text, priority) {
    return {
        id: Date.now(),
        text: text,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
}

// Função para salvar no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
}

// Função para filtrar tarefas
function filterTasks() {
    if (currentFilter === 'all') return tasks;
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    if (currentFilter === 'pending') return tasks.filter(t => !t.completed);
    return tasks;
}

// Função para alternar status da tarefa
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Função para deletar tarefa
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
}

// Função para atualizar estatísticas
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    document.getElementById('taskCount').textContent = 
        `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
    document.getElementById('completedCount').textContent = 
        `${completed} ${completed === 1 ? 'concluída' : 'concluídas'}`;
}

// Função para renderizar tarefas
function renderTasks() {
    const filteredTasks = filterTasks();
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma tarefa encontrada</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask(${task.id})"
            >
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <div class="task-meta">
                    <span class="priority-badge priority-${task.priority}">
                        ${task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <span>${formatDate(task.createdAt)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    Excluir
                </button>
            </div>
        </li>
    `).join('');

    initDragAndDrop();
}

//Drag and Drop 
function initDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    let draggedItem = null;

    taskItems.forEach(item => {
        item.setAttribute('draggable', true);
        
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            e.dataTransfer.setData('text/plain', ''); // Necessário para Firefox
            requestAnimationFrame(() => {
                this.classList.add('dragging');
            });
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (this === draggedItem) return;

            // Encontra os índices no array tasks
            const allItems = Array.from(taskList.children);
            const fromIndex = tasks.findIndex(t => t.id === parseInt(draggedItem.dataset.id));
            const toIndex = tasks.findIndex(t => t.id === parseInt(this.dataset.id));

            if (fromIndex !== -1 && toIndex !== -1) {
                // Move o item no array tasks
                const [movedItem] = tasks.splice(fromIndex, 1);
                tasks.splice(toIndex, 0, movedItem);
                
                // Atualiza o DOM
                if (fromIndex < toIndex) {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedItem, this);
                }

                // Salva a nova ordem
                saveTasks();
            }
        });
    });
}
    
// Adicionar nova tarefa
function addTask() {
    const text = taskInput.value.trim();
    const priority = taskPriority.value;
    
    if (!text) {
        taskInput.focus();
        return;
    }
    
    const newTask = createTask(text, priority);
    tasks.unshift(newTask);
    
    taskInput.value = '';
    taskInput.focus();
    
    saveTasks();
    renderTasks();
}

// Event Listeners - Versão corrigida
document.addEventListener('DOMContentLoaded', () => {
    // Botão adicionar
    const addBtn = document.getElementById('addTask');
    if (addBtn) {
        addBtn.addEventListener('click', addTask);
    }
    
    // Input de tarefa
    const input = document.getElementById('taskInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }
    
    // Botão limpar tudo
    const clearBtn = document.getElementById('clearAll');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (tasks.length === 0) {
                alert('Não há tarefas para limpar');
                return;
            }
            
            if (confirm('Deseja realmente limpar todas as tarefas?')) {
                tasks = [];
                saveTasks();
                renderTasks();
            }
        });
    }
    
    // Filtros
    const filters = document.querySelectorAll('.filter-btn');
    console.log('Filtros encontrados:', filters.length); // Debug
    
    filters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active de todos
            filters.forEach(b => b.classList.remove('active'));
            // Adiciona active no clicado
            e.target.classList.add('active');
            // Atualiza filtro
            currentFilter = e.target.getAttribute('data-filter');
            console.log('Filtro ativo:', currentFilter); // Debug
            renderTasks();
        });
    });
    
    // Renderizar ao carregar
    renderTasks();
    updateStats();
});