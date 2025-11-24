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
        
        swal({
            title: "Role Changed!",
            text: `You are now in ${this.role.toUpperCase()} mode`,
            icon: "success",
            button: "Continue",
        });
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
                    <h3>Select Your Role</h3>
                    <button id="modal-client">🛒 Client</button>
                    <button id="modal-admin">👨‍💼 Admin</button>
                </div>
            `).css('display', 'flex');
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
            html += `<button id="add-car-btn">➕ Add Car</button>`;
        }
        html += '<div class="card-row">';
        this.collection.each(car => {
            const cardImg = car.get('photo') || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop';
            html += `
                <div class="card">
                    <img class="card-photo" src="${cardImg}" alt="Car Image" />
                    <div class="card-model">${car.get('model')}</div>
                    <div class="card-price">₱${car.get('price')}</div>
                    ${car.get('status') === 'Available' ?
                      `<div class="card-status" style="color: #0891b2; background: rgba(8, 145, 178, 0.1);">${car.get('status')}</div>` :
                      `<div class="card-status" style="color: #ef4444; background: rgba(239, 68, 68, 0.1);">${car.get('status')}</div>`}
                    <div class="card-buttons">
                        ${car.get('status') === 'Available' && this.role === 'client' ?
                          `<button class="buy-now-btn" data-id="${car.cid}">🛒 Buy Now</button>` : ''}
                        ${this.role === 'admin' ?
                            `<button class="edit-car-btn" data-id="${car.cid}">✏️ Edit</button>
                             <button class="delete-car-btn" data-id="${car.cid}">🗑️ Delete</button>` : ''}
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
                <h3>Purchase: ${car.get('model')}</h3>
                <input id="client-name" type="text" placeholder="Full Name">
                <input id="client-email" type="email" placeholder="Email Address">
                <select id="payment-method">
                    <option value="Credit Card">💳 Credit Card</option>
                    <option value="Paypal">💰 PayPal</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                </select>
                <button id="confirm-buy">✓ Confirm Purchase</button>
                <button id="cancel-buy" style="background: #6b7280; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);">Cancel</button>
            </div>
        `).css('display', 'flex');
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
                
                swal({
                    title: "Purchase Successful!",
                    text: `Congratulations! You've purchased ${car.get('model')}`,
                    icon: "success",
                    button: "Great!",
                });
            } else {
                swal({
                    title: "Error",
                    text: "Please fill in all fields",
                    icon: "error",
                    button: "OK",
                });
            }
        });
    },
    showAddForm: function() {
        $('#buy-modal').html(`
            <div class="modal-content">
                <h3>Add New Car</h3>
                <img id="car-photo-preview" src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"/>
                <label for="car-photo" class="upload-label">📸 Upload Photo</label>
                <input id="car-photo" type="file" accept="image/*">
                <input id="car-model" type="text" placeholder="Car Model (e.g., Toyota Camry)">
                <input id="car-price" type="text" placeholder="Price (e.g., 25000)">
                <button id="save-car">💾 Save Car</button>
                <button id="cancel-car" style="background: #6b7280; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);">Cancel</button>
            </div>
        `).css('display', 'flex');

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
                        
                        swal({
                            title: "Car Added!",
                            text: `${model} has been added to the showroom`,
                            icon: "success",
                            button: "Awesome!",
                        });
                    }.bind(this);
                    reader.readAsDataURL(fileInput.files[0]);
                } else {
                    cars.add({ model, price, status: 'Available' });
                    $('#buy-modal').hide();
                    this.render();
                    
                    swal({
                        title: "Car Added!",
                        text: `${model} has been added to the showroom`,
                        icon: "success",
                        button: "Awesome!",
                    });
                }
            } else {
                swal({
                    title: "Error",
                    text: "Please fill in all fields",
                    icon: "error",
                    button: "OK",
                });
            }
        });
    },
    showEditForm: function(e) {
        const cid = $(e.currentTarget).data('id');
        const car = this.collection.get(cid);
        $('#buy-modal').html(`
            <div class="modal-content">
                <h3>Edit Car Details</h3>
                <img id="car-photo-preview-edit" src="${car.get('photo') || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'}"/>
                <label for="car-photo-edit" class="upload-label">📸 Change Photo</label>
                <input id="car-photo-edit" type="file" accept="image/*">
                <input id="car-model-edit" type="text" value="${car.get('model')}">
                <input id="car-price-edit" type="text" value="${car.get('price')}">
                <button id="update-car">✓ Update Car</button>
                <button id="cancel-edit" style="background: #6b7280; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);">Cancel</button>
            </div>
        `).css('display', 'flex');
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
                    
                    swal({
                        title: "Car Updated!",
                        text: `${car.get('model')} has been updated successfully`,
                        icon: "success",
                        button: "Perfect!",
                    });
                }.bind(this);
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                $('#buy-modal').hide();
                this.render();
                
                swal({
                    title: "Car Updated!",
                    text: `${car.get('model')} has been updated successfully`,
                    icon: "success",
                    button: "Perfect!",
                });
            }
        });
    },
    deleteCar: function(e) {
        const cid = $(e.currentTarget).data('id');
        const car = this.collection.get(cid);
        const carModel = car.get('model');
        
        swal({
            title: "Are you sure?",
            text: `Do you want to delete ${carModel}?`,
            icon: "warning",
            buttons: ["Cancel", "Yes, delete it"],
            dangerMode: true,
        })
        .then((willDelete) => {
            if (willDelete) {
                this.collection.remove(cid);
                this.render();
                
                swal({
                    title: "Deleted!",
                    text: `${carModel} has been removed from the showroom`,
                    icon: "success",
                    button: "OK",
                });
            }
        });
    }
});

const ClientListView = Backbone.View.extend({
    el: '#view-container',
    initialize: function(options) {
        this.role = options.role;
        this.render();
    },
    render: function() {
        let html = '<h2>📋 Client Purchase History</h2><div>';
        if(this.collection.length === 0) {
            html += '<div class="card" style="width: 100%; text-align: center; padding: 40px;"><p style="font-size: 1.1em; color: #6b7280;">No purchases yet.</p></div>';
        } else {
            this.collection.each(client=>{
                html += `
                    <div class="card" style="align-items:flex-start; text-align: left;">
                        <div style="margin-bottom: 12px;">
                            <strong style="font-size: 1.15em; color: #0c1e3d;">👤 ${client.get('name')}</strong>
                        </div>
                        <div style="color: #6b7280; margin-bottom: 6px;">
                            📧 ${client.get('email')}
                        </div>
                        <div style="color: #4a5568; margin-bottom: 6px;">
                            🚗 <strong>Car:</strong> ${client.get('carModel')}
                        </div>
                        <div style="color: #4a5568;">
                            💳 <strong>Payment:</strong> ${client.get('paymentMethod')}
                        </div>
                    </div>
                `;
            });
        }
        html += '</div>';
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