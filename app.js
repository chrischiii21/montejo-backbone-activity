// Models
const Car = Backbone.Model.extend({
    defaults: {
        model: '',
        price: '',
        status: 'Available',
        photo: ''
    }
});
const Client = Backbone.Model.extend({
    defaults: {
        name: '',
        email: '',
        carModel: '',
        paymentMethod: ''
    }
});

// Collections
const CarList = Backbone.Collection.extend({ model: Car });
const ClientList = Backbone.Collection.extend({ model: Client });

const cars = new CarList([
    { model: 'Toyota Camry', price: '25000', status: 'Available', photo:'' },
    { model: 'Honda Civic', price: '22000', status: 'Available', photo:'' }
]);
const clients = new ClientList();

// Main App View
const AppView = Backbone.View.extend({
    el: '#app',
    events: {
        'click #change-role-btn': 'toggleRole',
        'click .tab-btn': 'switchTab'
    },
    initialize: function() {
        this.role = localStorage.getItem('role') || 'client';
        this.renderRoleButton();
        this.currentTab = 'cars';
        this.renderTab();
        this.showRoleModal();
    },
    renderRoleButton: function() {
        this.$('#change-role-btn').text('Switch to ' + (this.role === 'admin' ? 'Client' : 'Admin'));
    },
    toggleRole: function() {
        this.role = this.role === 'admin' ? 'client' : 'admin';
        localStorage.setItem('role', this.role);
        this.renderRoleButton();
        this.renderTab();
    },
    switchTab: function(e) {
        $('.tab-btn').removeClass('active');
        $(e.currentTarget).addClass('active');
        this.currentTab = $(e.currentTarget).data('tab');
        this.renderTab();
    },
    renderTab: function() {
        if(this.currentTab === 'cars') {
            new CarListView({ collection: cars, role: this.role });
        } else if(this.currentTab === 'clients') {
            new ClientListView({ collection: clients, role: this.role });
        }
    },
    showRoleModal: function() {
        if(!localStorage.getItem('roleSet')) {
            $('#role-modal').html(`
                <div class="modal-content">
                    <h3>Select Role</h3>
                    <button id="modal-client">Client</button>
                    <button id="modal-admin">Admin</button>
                </div>
            `).show();
            $('#modal-client').click(()=>{ this.setRole('client'); });
            $('#modal-admin').click(()=>{ this.setRole('admin'); });
        }
    },
    setRole: function(role) {
        this.role = role;
        localStorage.setItem('role', role);
        localStorage.setItem('roleSet', '1');
        $('#role-modal').hide();
        this.renderRoleButton();
        this.renderTab();
    }
});

const CarListView = Backbone.View.extend({
    el: '#view-container',
    initialize: function(options) {
        this.role = options.role;
        this.render();
    },
    events: {
        'click .buy-now-btn': 'buyNow',
        'click #add-car-btn': 'showAddForm',
        'click .delete-car-btn': 'deleteCar',
        'click .edit-car-btn': 'showEditForm'
    },
    render: function() {
        let html = '';
        if(this.role === 'admin') {
            html += `<button id="add-car-btn">Add Car</button>`;
        }
        html += '<h2 style="display:none"></h2>';
        html += '<div style="width:100%;display:flex;flex-wrap:wrap;gap:24px 18px;">';
        this.collection.each(car => {
            const cardImg = car.get('photo') || 'https://via.placeholder.com/220x120?text=Car+Photo';
            html += `
                <div class="card">
                    <img class="card-photo" src="${cardImg}" alt="Car Image" />
                    <div class="card-model">${car.get('model')}</div>
                    <div class="card-price">$${car.get('price')}</div>
                    ${car.get('status') === 'Available' ?
                      `<div class="card-status" style="color: #00bfae;">${car.get('status')}</div>` :
                      `<div class="card-status" style="color: #b71c1c;">${car.get('status')}</div>`}
                    <div class="card-buttons">
                        ${car.get('status') === 'Available' && this.role === 'client' ?
                          `<button class="buy-now-btn" data-id="${car.cid}">Buy Now</button>` : ''}
                        ${this.role === 'admin' ?
                            `<button class="edit-car-btn" data-id="${car.cid}">Edit</button>
                             <button class="delete-car-btn" data-id="${car.cid}">Delete</button>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        this.$el.html(html);
    },
    buyNow: function(e) {
        const cid = $(e.currentTarget).data('id');
        const car = this.collection.get(cid);
        $('#buy-modal').html(`
            <div class="modal-content">
                <h3>Buy: ${car.get('model')}</h3>
                <input id="client-name" type="text" placeholder="Name">
                <input id="client-email" type="text" placeholder="Email">
                <select id="payment-method">
                    <option value="Credit Card">Credit Card</option>
                    <option value="Paypal">Paypal</option>
                </select>
                <button id="confirm-buy">Confirm</button>
                <button id="cancel-buy">Cancel</button>
            </div>
        `).show();
        $('#cancel-buy').click(()=>{ $('#buy-modal').hide(); });
        $('#confirm-buy').click(()=>{
            const name = $('#client-name').val();
            const email = $('#client-email').val();
            const method = $('#payment-method').val();
            if(name && email) {
                clients.add({
                    name, email, carModel: car.get('model'), paymentMethod: method
                });
                car.set('status', 'Sold');
                $('#buy-modal').hide();
                this.render();
            }
        });
    },
    showAddForm: function() {
        $('#buy-modal').html(`
            <div class="modal-content">
                <h3>Add Car</h3>
                <img id="car-photo-preview" src="https://via.placeholder.com/220x120?text=Car+Photo"/>
                <label for="car-photo" class="upload-label">Upload Photo</label>
                <input id="car-photo" type="file" accept="image/*">
                <input id="car-model" type="text" placeholder="Model">
                <input id="car-price" type="text" placeholder="Price">
                <button id="save-car">Save</button>
                <button id="cancel-car">Cancel</button>
            </div>
        `).show();

        $('#cancel-car').click(()=>{ $('#buy-modal').hide(); });

        $('#car-photo').change(function(e){
            const file = e.target.files[0];
            if(file){
                const reader = new FileReader();
                reader.onload = function(e){
                    $('#car-photo-preview').attr('src', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });

        $('#save-car').click(()=>{
            const model = $('#car-model').val();
            const price = $('#car-price').val();
            const fileInput = $('#car-photo')[0];
            if(model && price) {
                if(fileInput.files && fileInput.files[0]){
                    const reader = new FileReader();
                    reader.onload = function(e){
                        cars.add({ model, price, status: 'Available', photo: e.target.result });
                        $('#buy-modal').hide();
                        this.render();
                    }.bind(this);
                    reader.readAsDataURL(fileInput.files[0]);
                } else {
                    cars.add({ model, price, status: 'Available' });
                    $('#buy-modal').hide();
                    this.render();
                }
            }
        });
    },
    showEditForm: function(e) {
        const cid = $(e.currentTarget).data('id');
        const car = this.collection.get(cid);
        $('#buy-modal').html(`
            <div class="modal-content">
                <h3>Edit Car</h3>
                <img id="car-photo-preview-edit" src="${car.get('photo') || 'https://via.placeholder.com/220x120?text=Car+Photo'}"/>
                <label for="car-photo-edit" class="upload-label">Upload Photo</label>
                <input id="car-photo-edit" type="file" accept="image/*">
                <input id="car-model-edit" type="text" value="${car.get('model')}">
                <input id="car-price-edit" type="text" value="${car.get('price')}">
                <button id="update-car">Update</button>
                <button id="cancel-edit">Cancel</button>
            </div>
        `).show();
        $('#cancel-edit').click(()=>{ $('#buy-modal').hide(); });
        $('#car-photo-edit').change(function(e){
            const file = e.target.files[0];
            if(file){
                const reader = new FileReader();
                reader.onload = function(e){
                    $('#car-photo-preview-edit').attr('src', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });

        $('#update-car').click(()=>{
            car.set('model', $('#car-model-edit').val());
            car.set('price', $('#car-price-edit').val());
            const fileInput = $('#car-photo-edit')[0];
            if(fileInput.files && fileInput.files[0]){
                const reader = new FileReader();
                reader.onload = function(e){
                    car.set('photo', e.target.result);
                    $('#buy-modal').hide();
                    this.render();
                }.bind(this);
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                $('#buy-modal').hide();
                this.render();
            }
        });
    },
    deleteCar: function(e) {
        if(confirm('Delete this car?')) {
            const cid = $(e.currentTarget).data('id');
            this.collection.remove(cid);
            this.render();
        }
    }
});

const ClientListView = Backbone.View.extend({
    el: '#view-container',
    initialize: function(options) {
        this.role = options.role;
        this.render();
    },
    render: function() {
        let html = '<h2>Clients Who Purchased</h2>';
        if(this.collection.length === 0) {
            html += '<p>No clients yet.</p>';
        } else {
            this.collection.each(client=>{
                html += `
                    <div class="card" style="align-items:flex-start;">
                        <b>${client.get('name')}</b> (${client.get('email')}) <br>
                        Car Model: ${client.get('carModel')}<br>
                        Payment: ${client.get('paymentMethod')}
                    </div>
                `;
            });
        }
        this.$el.html(html);
    }
});

// App Entry
$(function(){
    new AppView();
    $(document).on('click', '.modal', function(e){
        if(e.target === this) $(this).hide();
    });
});
