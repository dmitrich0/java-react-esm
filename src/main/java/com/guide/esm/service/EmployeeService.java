package com.guide.esm.service;

import com.guide.esm.dto.EmployeeDto;

public interface EmployeeService {
    EmployeeDto create(EmployeeDto dto);

    EmployeeDto getById(Long id);
}
