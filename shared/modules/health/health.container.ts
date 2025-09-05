import { Container } from 'inversify';
import { Component } from '../../types/index.js';
import { HealthController } from './health.controller.js';

export function createHealthContainer() {
  const healthContainer = new Container();

  healthContainer
    .bind<HealthController>(Component.HealthController)
    .to(HealthController)
    .inSingletonScope();

  return healthContainer;
}
