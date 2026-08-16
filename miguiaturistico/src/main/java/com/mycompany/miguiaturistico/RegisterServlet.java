package com.mycompany.miguiaturistico;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Base64;

@WebServlet(name="RegisterServlet", urlPatterns={"/RegisterServlet"})
public class RegisterServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            String documentType = request.getParameter("document_type");
            String documentNumber = request.getParameter("document_number");
            String firstName = request.getParameter("first_name");
            String lastName = request.getParameter("last_name");
            String nationality = request.getParameter("nationality");
            String email = request.getParameter("email");
            String countryCode = request.getParameter("country_code");
            String phone = request.getParameter("phone");
            
            if (documentType == null || documentType.isEmpty() ||
                documentNumber == null || documentNumber.isEmpty() ||
                firstName == null || firstName.isEmpty() ||
                lastName == null || lastName.isEmpty() ||
                nationality == null || nationality.isEmpty() ||
                email == null || email.isEmpty() ||
                countryCode == null || countryCode.isEmpty() ||
                phone == null || phone.isEmpty()) {
                
                out.println("<!DOCTYPE html>");
                out.println("<html>");
                out.println("<head>");
                out.println("<title>Error de Registro</title>");
                out.println("<meta charset='UTF-8'>");
                out.println("<style>");
                out.println("body { font-family: Arial, sans-serif; margin: 40px; }");
                out.println(".error { color: #d32f2f; background-color: #ffebee; padding: 20px; border-radius: 4px; }");
                out.println("</style>");
                out.println("</head>");
                out.println("<body>");
                out.println("<div class='error'>");
                out.println("<h2>Error</h2>");
                out.println("<p>Todos los campos son requeridos.</p>");
                out.println("</div>");
                out.println("</body>");
                out.println("</html>");
                return;
            }
            
            Connection conn = Conexion.conectar();
            
            if (conn == null) {
                out.println("<!DOCTYPE html>");
                out.println("<html>");
                out.println("<head>");
                out.println("<title>Error de Conexión</title>");
                out.println("<meta charset='UTF-8'>");
                out.println("<style>");
                out.println("body { font-family: Arial, sans-serif; margin: 40px; }");
                out.println(".error { color: #d32f2f; background-color: #ffebee; padding: 20px; border-radius: 4px; }");
                out.println("</style>");
                out.println("</head>");
                out.println("<body>");
                out.println("<div class='error'>");
                out.println("<h2>Error de Conexión</h2>");
                out.println("<p>No se pudo conectar a la base de datos.</p>");
                out.println("</div>");
                out.println("</body>");
                out.println("</html>");
                return;
            }
            
            String checkDocumentSQL = "SELECT COUNT(*) as count FROM users WHERE document_number = ?";
            PreparedStatement checkDocumentStmt = conn.prepareStatement(checkDocumentSQL);
            checkDocumentStmt.setString(1, documentNumber);
            ResultSet docResultSet = checkDocumentStmt.executeQuery();
            
            int documentCount = 0;
            if (docResultSet.next()) {
                documentCount = docResultSet.getInt("count");
            }
            
            docResultSet.close();
            checkDocumentStmt.close();
            
            if (documentCount > 0) {
                out.println("<!DOCTYPE html>");
                out.println("<html>");
                out.println("<head>");
                out.println("<title>Error de Registro</title>");
                out.println("<meta charset='UTF-8'>");
                out.println("<style>");
                out.println("body { font-family: Arial, sans-serif; margin: 40px; }");
                out.println(".error { color: #d32f2f; background-color: #ffebee; padding: 20px; border-radius: 4px; }");
                out.println("</style>");
                out.println("</head>");
                out.println("<body>");
                out.println("<div class='error'>");
                out.println("<h2>Error</h2>");
                out.println("<p>El número de documento ya está registrado en el sistema.</p>");
                out.println("</div>");
                out.println("</body>");
                out.println("</html>");
                conn.close();
                return;
            }
            
            String checkEmailSQL = "SELECT COUNT(*) as count FROM users WHERE email = ?";
            PreparedStatement checkEmailStmt = conn.prepareStatement(checkEmailSQL);
            checkEmailStmt.setString(1, email);
            ResultSet emailResultSet = checkEmailStmt.executeQuery();
            
            int emailCount = 0;
            if (emailResultSet.next()) {
                emailCount = emailResultSet.getInt("count");
            }
            
            emailResultSet.close();
            checkEmailStmt.close();
            
            if (emailCount > 0) {
                out.println("<!DOCTYPE html>");
                out.println("<html>");
                out.println("<head>");
                out.println("<title>Error de Registro</title>");
                out.println("<meta charset='UTF-8'>");
                out.println("<style>");
                out.println("body { font-family: Arial, sans-serif; margin: 40px; }");
                out.println(".error { color: #d32f2f; background-color: #ffebee; padding: 20px; border-radius: 4px; }");
                out.println("</style>");
                out.println("</head>");
                out.println("<body>");
                out.println("<div class='error'>");
                out.println("<h2>Error</h2>");
                out.println("<p>El email ya está registrado en el sistema.</p>");
                out.println("</div>");
                out.println("</body>");
                out.println("</html>");
                conn.close();
                return;
            }
            
            String temporalPassword = generateRandomPassword(10);
            String passwordHash = hashSHA256(temporalPassword);
            
            String insertSQL = "INSERT INTO users (company_id, role_id, document_type, document_number, first_name, last_name, email, password_hash, phone, nationality, country_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement insertStmt = conn.prepareStatement(insertSQL);
            
            insertStmt.setInt(1, 1);
            insertStmt.setInt(2, 1);
            insertStmt.setString(3, documentType);
            insertStmt.setString(4, documentNumber);
            insertStmt.setString(5, firstName);
            insertStmt.setString(6, lastName);
            insertStmt.setString(7, email);
            insertStmt.setString(8, passwordHash);
            insertStmt.setString(9, phone);
            insertStmt.setString(10, nationality);
            insertStmt.setString(11, countryCode);
            insertStmt.setString(12, "ACTIVE");
            
            insertStmt.executeUpdate();
            insertStmt.close();
            conn.close();
            
            out.println("<!DOCTYPE html>");
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Registro Exitoso</title>");
            out.println("<meta charset='UTF-8'>");
            out.println("<style>");
            out.println("body { font-family: Arial, sans-serif; margin: 40px; }");
            out.println(".success { color: #1b5e20; background-color: #e8f5e9; padding: 20px; border-radius: 4px; }");
            out.println(".info { color: #01579b; background-color: #e1f5fe; padding: 20px; border-radius: 4px; margin-top: 20px; }");
            out.println("</style>");
            out.println("</head>");
            out.println("<body>");
            out.println("<div class='success'>");
            out.println("<h2>¡Registro Exitoso!</h2>");
            out.println("<p>El usuario ha sido registrado correctamente en el sistema.</p>");
            out.println("</div>");
            out.println("<div class='info'>");
            out.println("<h3>Datos de Acceso Temporal (Solo para Pruebas)</h3>");
            out.println("<p><strong>Email:</strong> " + escapeHtml(email) + "</p>");
            out.println("<p><strong>Contraseña Temporal:</strong> " + escapeHtml(temporalPassword) + "</p>");
            out.println("<p><em>Por favor, cambie la contraseña en su primer acceso.</em></p>");
            out.println("</div>");
            out.println("</body>");
            out.println("</html>");
            
        } catch (SQLException e) {
            out.println("<!DOCTYPE html>");
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Error en Base de Datos</title>");
            out.println("<meta charset='UTF-8'>");
            out.println("<style>");
            out.println("body { font-family: Arial, sans-serif; margin: 40px; }");
            out.println(".error { color: #d32f2f; background-color: #ffebee; padding: 20px; border-radius: 4px; }");
            out.println("</style>");
            out.println("</head>");
            out.println("<body>");
            out.println("<div class='error'>");
            out.println("<h2>Error en Base de Datos</h2>");
            out.println("<p>Ocurrió un error al procesar el registro: " + e.getMessage() + "</p>");
            out.println("</div>");
            out.println("</body>");
            out.println("</html>");
        } finally {
            out.close();
        }
    }

    private String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();
        
        for (int i = 0; i < length; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return password.toString();
    }

    private String hashSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes());
            return Base64.getEncoder().encodeToString(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            return null;
        }
    }

    private String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#x27;");
    }

    @Override
    public String getServletInfo() {
        return "Servlet para registrar nuevos usuarios";
    }
}
