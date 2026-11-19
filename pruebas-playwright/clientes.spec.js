
const { test, expect } = require('@playwright/test');

test('CP001 - Registrar un cliente correctamente', async ({ page }) => {

  // Configurar velocidad de ejecución visible
  page.setDefaultTimeout(15000);

  // 1. Abrir el módulo de clientes
  await page.goto('http://localhost:3000/clientes');

  // Esperar a que el módulo esté disponible
  await expect(page.locator('#crear-cliente')).toBeEnabled();

  // Mostrar el módulo antes de comenzar
  await page.waitForTimeout(3000);

  // 2. Abrir el formulario de registro
  await page.locator('#crear-cliente').click();

  await expect(page.locator('#cliente-nombre')).toBeVisible();
  await page.waitForTimeout(2000);

  // 3. Generar datos únicos
  const identificador = Date.now();

  const nombreCliente = `Cliente Prueba ${identificador}`;
  const correoCliente = `prueba${identificador}@correo.com`;

  // 4. Completar automáticamente el nombre
  await page.locator('#cliente-nombre').fill(nombreCliente);
  await page.waitForTimeout(1800);

  // 5. Completar el correo
  await page.locator('#cliente-correo').fill(correoCliente);
  await page.waitForTimeout(1800);

  // 6. Completar el teléfono
  await page.locator('#cliente-telefono').fill('3001234567');
  await page.waitForTimeout(1800);

  // 7. Completar las observaciones
  await page.locator('#cliente-observaciones').fill(
    'Registro automatizado mediante Playwright'
  );

  // Mantener visible el formulario completo
  await page.waitForTimeout(4000);

  // 8. Guardar el cliente
  await page.locator(
    '#formulario-cliente button[type="submit"]'
  ).click();

  // 9. Verificar el mensaje de confirmación
  await expect(page.locator('#mensaje-clientes'))
    .toContainText('Cliente registrado correctamente.');

  await page.waitForTimeout(2500);

  // 10. Verificar que el cliente aparece en la tabla
  const clienteRegistrado = page.locator('#tabla-clientes')
    .getByText(nombreCliente, { exact: true });

  await expect(clienteRegistrado).toBeVisible();

  // Mantener visible el resultado final
  await page.waitForTimeout(6000);

});
