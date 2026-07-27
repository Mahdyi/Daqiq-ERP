import type { ApiPage } from '@daqiq/core';

import type { SystemSettingPageResponseDto } from '../dto/system-setting-page-response.dto';
import type { SystemSettingResponseDto } from '../dto/system-setting-response.dto';
import type { SystemSetting } from '../models/system-setting.model';

export function mapSystemSettingResponseDto(
  dto: SystemSettingResponseDto
): SystemSetting {
  return {
    id: dto.id,
    settingKey: dto.settingKey,
    settingValue: dto.settingValue,
    valueType: dto.valueType,
    category: dto.category,
    label: dto.label,
    description: dto.description,
    editable: dto.editable,
    active: dto.active,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt)
  };
}

export function mapSystemSettingPageResponseDto(
  dto: SystemSettingPageResponseDto
): ApiPage<SystemSetting> {
  return {
    items: dto.items.map(mapSystemSettingResponseDto),
    page: dto.page - 1,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages
  };
}
