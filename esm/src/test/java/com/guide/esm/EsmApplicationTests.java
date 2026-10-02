package com.guide.esm;

import com.guide.esm.entity.Employee;
import com.guide.esm.repository.EmployeeRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "spring.config.import=")
@Testcontainers
class EsmApplicationTests {

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17.6-alpine");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    EmployeeRepository employees;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    Flyway flyway;

    @Test
    @Transactional
    void employeeCrudWorksOnMigratedSchema() {
        Employee saved = employees.saveAndFlush(new Employee(null, "Anna", "Ivanova", "anna@example.com"));
        Long id = saved.getId();
        assertNotNull(id);
        assertEquals("Anna", jdbc.queryForObject(
                "SELECT first_name FROM esm.employees WHERE id = ?", String.class, id));

        saved.setFirstName("Maria");
        employees.saveAndFlush(saved);
        assertEquals("Maria", jdbc.queryForObject(
                "SELECT first_name FROM esm.employees WHERE id = ?", String.class, id));

        employees.deleteById(id);
        employees.flush();
        assertFalse(employees.existsById(id));
    }

    @Test
    @Transactional
    void databaseRejectsDuplicateEmail() {
        employees.saveAndFlush(new Employee(null, "Anna", "Ivanova", "duplicate@example.com"));
        assertThrows(DataIntegrityViolationException.class, () -> employees.saveAndFlush(
                new Employee(null, "Ivan", "Ivanov", "duplicate@example.com")));
    }

    @Test
    void migrationIsVersionedAndRerunnable() {
        assertEquals(0, flyway.migrate().migrationsExecuted);
        assertEquals("1", jdbc.queryForObject(
                "SELECT version FROM esm.flyway_schema_history WHERE version = '1' AND success", String.class));
        assertEquals(Boolean.TRUE, jdbc.queryForObject(
                "SELECT relrowsecurity FROM pg_class WHERE oid = 'esm.employees'::regclass", Boolean.class));
        assertNull(jdbc.queryForObject("SELECT to_regclass('public.employees')::text", String.class));
    }
}
