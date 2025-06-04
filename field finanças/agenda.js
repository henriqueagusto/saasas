class AgendaApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedView = 'day'; // day, week, month
        this.events = this.loadEvents();
        this.init();
    }

    init() {
        this.renderCalendar();
        this.setupEventListeners();
    }

    loadEvents() {
        const saved = localStorage.getItem('plarufrda-events');
        return saved ? JSON.parse(saved) : [];
    }

    saveEvents() {
        localStorage.setItem('plarufrda-events', JSON.stringify(this.events));
    }

    renderCalendar() {
        this.updateHeader();
        
        if (this.selectedView === 'day') {
            this.renderDayView();
        } else if (this.selectedView === 'week') {
            this.renderWeekView();
        } else {
            this.renderMonthView();
        }
    }

    updateHeader() {
        const options = { month: 'long', year: 'numeric' };
        document.querySelector('.current-period').textContent = 
            this.currentDate.toLocaleDateString('pt-BR', options);
        
        if (this.selectedView === 'day') {
            const dayOptions = { weekday: 'long', day: 'numeric', month: 'long' };
            const dateStr = this.currentDate.toLocaleDateString('pt-BR', dayOptions);
            const [dayName, date] = dateStr.split(', ');
            
            document.querySelector('.day-name').textContent = dayName;
            document.querySelector('.day-date').textContent = date;
        }
    }

    renderDayView() {
        const timeColumn = document.querySelector('.time-column');
        const eventsColumn = document.querySelector('.events-column');
        
        // Limpa colunas
        timeColumn.innerHTML = '';
        eventsColumn.innerHTML = '';
        
        // Adiciona slots de tempo
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour}:00`;
            timeColumn.appendChild(timeSlot);
        }
        
        // Filtra eventos do dia
        const dayStart = new Date(this.currentDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(this.currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayEvents = this.events.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate >= dayStart && eventDate <= dayEnd;
        });
        
        // Renderiza eventos
        dayEvents.forEach(event => {
            this.renderDayEvent(event);
        });
    }

    renderDayEvent(event) {
        const eventStart = new Date(event.startDate);
        const hour = eventStart.getHours();
        const minutes = eventStart.getMinutes();
        
        const top = hour * 60 + minutes;
        const height = 60; // Altura padrão de 1h
        
        const eventElement = document.createElement('div');
        eventElement.className = 'day-event';
        eventElement.style.top = `${top}px`;
        eventElement.style.height = `${height}px`;
        eventElement.style.backgroundColor = this.getEventColor(event);
        
        eventElement.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-time">${this.formatTime(eventStart)}</div>
        `;
        
        eventElement.addEventListener('click', () => {
            this.editEvent(event);
        });
        
        document.querySelector('.events-column').appendChild(eventElement);
    }

    renderWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekHeader = document.querySelector('.week-header');
        const weekGrid = document.querySelector('.week-grid');
        
        // Limpa visualização
        weekHeader.innerHTML = '';
        weekGrid.innerHTML = '';
        
        // Cria cabeçalho dos dias
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'week-day';
            
            const isToday = this.isSameDay(day, new Date());
            if (isToday) {
                dayElement.classList.add('active');
            }
            
            dayElement.innerHTML = `
                <span>${day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                <span class="date">${day.getDate()}</span>
            `;
            
            weekHeader.appendChild(dayElement);
        }
        
        // Cria grade de horas
        for (let hour = 0; hour < 24; hour++) {
            for (let day = 0; day < 7; day++) {
                const slot = document.createElement('div');
                slot.className = 'week-slot';
                slot.dataset.day = day;
                slot.dataset.hour = hour;
                weekGrid.appendChild(slot);
            }
        }
        
        // Adiciona eventos
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekEvents = this.events.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate >= weekStart && eventDate < weekEnd;
        });
        
        weekEvents.forEach(event => {
            this.renderWeekEvent(event);
        });
    }

    renderWeekEvent(event) {
        const eventDate = new Date(event.startDate);
        const dayOfWeek = eventDate.getDay();
        const hour = eventDate.getHours();
        
        const slot = document.querySelector(`.week-slot[data-day="${dayOfWeek}"][data-hour="${hour}"]`);
        if (!slot) return;
        
        const eventElement = document.createElement('div');
        eventElement.className = 'week-event';
        eventElement.style.backgroundColor = this.getEventColor(event);
        eventElement.textContent = event.title;
        
        eventElement.addEventListener('click', () => {
            this.editEvent(event);
        });
        
        slot.appendChild(eventElement);
    }

    renderMonthView() {
        const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        const startDay = monthStart.getDay();
        const totalDays = monthEnd.getDate();
        
        const prevMonthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0).getDate();
        
        const monthGrid = document.querySelector('.month-grid');
        monthGrid.innerHTML = '';
        
        // Dias do mês anterior
        for (let i = startDay - 1; i >= 0; i--) {
            const dayElement = this.createMonthDayElement(prevMonthEnd - i, true);
            monthGrid.appendChild(dayElement);
        }
        
        // Dias do mês atual
        const today = new Date();
        for (let i = 1; i <= totalDays; i++) {
            const dayElement = this.createMonthDayElement(i, false);
            
            if (this.currentDate.getFullYear() === today.getFullYear() && 
                this.currentDate.getMonth() === today.getMonth() && 
                i === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            monthGrid.appendChild(dayElement);
        }
        
        // Dias do próximo mês
        const daysToAdd = 42 - (startDay + totalDays);
        for (let i = 1; i <= daysToAdd; i++) {
            const dayElement = this.createMonthDayElement(i, true);
            monthGrid.appendChild(dayElement);
        }
    }

    createMonthDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'month-day';
        
        if (isOtherMonth) {
            dayElement.style.opacity = '0.5';
        }
        
        dayElement.innerHTML = `<span class="date">${day}</span>`;
        
        // Conta eventos para este dia
        const date = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth(),
            day
        );
        
        const dayEvents = this.events.filter(event => {
            const eventDate = new Date(event.startDate);
            return this.isSameDay(eventDate, date);
        });
        
        if (dayEvents.length > 0) {
            const countElement = document.createElement('div');
            countElement.className = 'events-count';
            countElement.textContent = dayEvents.length;
            dayElement.appendChild(countElement);
        }
        
        dayElement.addEventListener('click', () => {
            this.currentDate = date;
            this.selectedView = 'day';
            this.updateView();
            this.renderCalendar();
        });
        
        return dayElement;
    }

    updateView() {
        // Atualiza botões de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === this.selectedView) {
                btn.classList.add('active');
            }
        });
        
        // Atualiza visualizações
        document.querySelectorAll('.day-view, .week-view, .month-view').forEach(view => {
            view.classList.remove('active');
        });
        
        document.getElementById(`${this.selectedView}-view`).classList.add('active');
    }

    getWeekStart(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    formatTime(date) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    getEventColor(event) {
        const colors = getComputedStyle(document.documentElement)
            .getPropertyValue('--event-colors')
            .split(', ')
            .map(c => c.trim());
        
        const hash = event.title.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        
        return colors[Math.abs(hash) % colors.length];
    }

    setupEventListeners() {
        // Navegação
        document.getElementById('prev-period').addEventListener('click', () => {
            if (this.selectedView === 'day') {
                this.currentDate.setDate(this.currentDate.getDate() - 1);
            } else if (this.selectedView === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() - 7);
            } else {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            }
            this.renderCalendar();
        });
        
        document.getElementById('next-period').addEventListener('click', () => {
            if (this.selectedView === 'day') {
                this.currentDate.setDate(this.currentDate.getDate() + 1);
            } else if (this.selectedView === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() + 7);
            } else {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            }
            this.renderCalendar();
        });
        
        document.getElementById('go-today').addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderCalendar();
        });
        
        // Troca de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedView = btn.dataset.view;
                this.updateView();
                this.renderCalendar();
            });
        });
        
        // Botão adicionar evento
        document.querySelector('.fab').addEventListener('click', () => {
            this.showEventModal();
        });
        
        // Modal
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.hideEventModal();
        });
        
        document.querySelector('.btn.secondary').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideEventModal();
        });
        
        document.querySelector('.event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });
        
        // Recorrência
        document.querySelector('.recurring').addEventListener('change', (e) => {
            const options = document.querySelector('.recurrence-options');
            if (e.target.checked) {
                options.classList.remove('hidden');
            } else {
                options.classList.add('hidden');
            }
        });
    }

    showEventModal(event = null) {
        const modal = document.getElementById('event-modal');
        const form = document.querySelector('.event-form');
        
        if (event) {
            // Modo edição
            document.querySelector('.modal-header h3').textContent = 'Editar Evento';
            form.dataset.eventId = event.id;
            form.querySelector('.event-title').value = event.title;
            
            const startDate = new Date(event.startDate);
            form.querySelector('.event-date').value = startDate.toISOString().split('T')[0];
            
            if (event.allDay) {
                form.querySelector('.all-day').checked = true;
                form.querySelector('.event-time').value = '';
            } else {
                form.querySelector('.event-time').value = 
                    startDate.toTimeString().substring(0, 5);
            }
            
            if (event.recurrence) {
                form.querySelector('.recurring').checked = true;
                form.querySelector('.recurrence-options').classList.remove('hidden');
                form.querySelector('.recurrence-type').value = event.recurrence.type;
            }
        } else {
            // Modo criação
            document.querySelector('.modal-header h3').textContent = 'Novo Evento';
            form.reset();
            delete form.dataset.eventId;
            
            // Preenche data atual
            form.querySelector('.event-date').value = 
                this.currentDate.toISOString().split('T')[0];
        }
        
        modal.classList.remove('hidden');
    }

    hideEventModal() {
        document.getElementById('event-modal').classList.add('hidden');
    }

    saveEvent() {
        const form = document.querySelector('.event-form');
        const title = form.querySelector('.event-title').value;
        const date = form.querySelector('.event-date').value;
        const time = form.querySelector('.event-time').value;
        const allDay = form.querySelector('.all-day').checked;
        const isRecurring = form.querySelector('.recurring').checked;
        const recurrenceType = form.querySelector('.recurrence-type').value;
        
        const startDate = allDay ? 
            `${date}T00:00:00` : 
            `${date}T${time}:00`;
        
        const newEvent = {
            id: form.dataset.eventId || Date.now(),
            title,
            startDate,
            allDay,
            createdAt: new Date().toISOString()
        };
        
        if (isRecurring) {
            newEvent.recurrence = {
                type: recurrenceType
            };
        }
        
        // Adiciona ou atualiza evento
        if (form.dataset.eventId) {
            const index = this.events.findIndex(e => e.id == form.dataset.eventId);
            if (index !== -1) {
                this.events[index] = newEvent;
            }
        } else {
            this.events.push(newEvent);
        }
        
        this.saveEvents();
        this.renderCalendar();
        this.hideEventModal();
    }

    editEvent(event) {
        this.showEventModal(event);
    }
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
    new AgendaApp();
});