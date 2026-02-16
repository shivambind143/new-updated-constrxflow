-- ConstruxFlow Database Schema
-- Construction Management System

CREATE DATABASE IF NOT EXISTS construxflow;
USE construxflow;

-- Users table (Contractors, Workers, Suppliers, Admin)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role ENUM('contractor', 'worker', 'supplier', 'admin') NOT NULL,
    worker_type VARCHAR(50), -- For workers: Labor, Engineer, etc.
    profile_image VARCHAR(255) DEFAULT 'default-avatar.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE
);

-- Projects table
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contractor_id INT NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    required_labor INT DEFAULT 0,
    required_engineer INT DEFAULT 0,
    labor_payment DECIMAL(10,2),
    engineer_payment DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Worker applications
CREATE TABLE worker_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    worker_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (project_id, worker_id)
);

-- Supplier inventory
CREATE TABLE supplier_inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit ENUM('kg', 'meter', 'liter', 'piece') NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Material orders
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    contractor_id INT NOT NULL,
    supplier_id INT NOT NULL,
    material_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES supplier_inventory(id) ON DELETE CASCADE
);

-- Ratings table
CREATE TABLE ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rated_by INT NOT NULL,
    rated_to INT NOT NULL,
    project_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (rated_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Insert default admin account
-- Password: admin123 (hashed)
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@construxflow.com', '$2b$10$xQZ8K3zGvY.jQvXqH9X0lOYJZ4w6yF8mN2tC5sD7pE3rF8tG9uH0i', 'admin');
