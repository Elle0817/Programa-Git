package com.miguia.backendapi.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    WebMvcConfigurer corsConfigurer(
            @Value("${spring.web.cors.allowed-origins}") String allowedOrigins,
            @Value("${spring.web.cors.allowed-methods}") String allowedMethods,
            @Value("${spring.web.cors.allowed-headers}") String allowedHeaders) {
        List<String> origins = Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList();
        List<String> methods = Arrays.stream(allowedMethods.split(",")).map(String::trim).toList();
        List<String> headers = Arrays.stream(allowedHeaders.split(",")).map(String::trim).toList();

        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(origins.toArray(String[]::new))
                        .allowedMethods(methods.toArray(String[]::new))
                        .allowedHeaders(headers.toArray(String[]::new))
                        .allowCredentials(false)
                        .maxAge(3600);
            }
        };
    }
}
