import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated, Image, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import DateRangePicker from '@/components/filters/DateRangePicker';
import NumberRangePicker from '@/components/filters/NumberRangePicker';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDevices, getLastReport } from '@/lib/database';
import { useMachineTypes } from '@/contexts/machine-types-context';
import { useNavigation } from '@/contexts/navigation-context';
import ScanButton from '@/components/scan-button';
import AnimatedStatusIcon from '@/components/animated-status-icon';

function NoQRIcon() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        Animated.delay(700),
      ])
    );
    rotate.start();
    return () => rotate.stop();
  }, [rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <MaterialIcons name="qr-code" size={32} color="#ef4444" />
    </Animated.View>
  );
}
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getReportInterval } from '@/lib/settings';

function getDarkerColor(color: string) {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 40);
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function DevicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { getMachineTypeById, machineTypes, isLoading: machineTypesLoading } = useMachineTypes();
  const { navigate, isNavigating } = useNavigation();
  const [devices, setDevices] = useState<any[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'created' | 'name' | 'status' | 'type' | 'serial' | 'lastReport'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tempSortBy, setTempSortBy] = useState<'created' | 'name' | 'status' | 'type' | 'serial' | 'lastReport'>('created');
  const [tempSortOrder, setTempSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [isConfigLoadedRefresh, setIsConfigLoadedRefresh] = useState<number>(0);
  const [filterTypes, setFilterTypes] = useState<number[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [lastReportDateFrom, setLastReportDateFrom] = useState<Date | null>(null);
  const [lastReportDateTo, setLastReportDateTo] = useState<Date | null>(null);
  const [daysUntilReportMin, setDaysUntilReportMin] = useState<number | null>(null);
  const [daysUntilReportMax, setDaysUntilReportMax] = useState<number | null>(null);
  const [reportsCountMin, setReportsCountMin] = useState<number | null>(null);
  const [reportsCountMax, setReportsCountMax] = useState<number | null>(null);
  const [createdDateFrom, setCreatedDateFrom] = useState<Date | null>(null);
  const [createdDateTo, setCreatedDateTo] = useState<Date | null>(null);
  const [updatedDateFrom, setUpdatedDateFrom] = useState<Date | null>(null);
  const [updatedDateTo, setUpdatedDateTo] = useState<Date | null>(null);
  const [maxReportsCount, setMaxReportsCount] = useState(0);
  const [maxDaysUntilReport, setMaxDaysUntilReport] = useState(0);
  
  const [tempFilterTypes, setTempFilterTypes] = useState<number[]>([]);
  const [tempFilterStatuses, setTempFilterStatuses] = useState<string[]>([]);
  const [tempLastReportDateFrom, setTempLastReportDateFrom] = useState<Date | null>(null);
  const [tempLastReportDateTo, setTempLastReportDateTo] = useState<Date | null>(null);
  const [tempDaysUntilReportMin, setTempDaysUntilReportMin] = useState<number | null>(null);
  const [tempDaysUntilReportMax, setTempDaysUntilReportMax] = useState<number | null>(null);
  const [tempReportsCountMin, setTempReportsCountMin] = useState<number | null>(null);
  const [tempReportsCountMax, setTempReportsCountMax] = useState<number | null>(null);
  const [tempCreatedDateFrom, setTempCreatedDateFrom] = useState<Date | null>(null);
  const [tempCreatedDateTo, setTempCreatedDateTo] = useState<Date | null>(null);
  const [tempUpdatedDateFrom, setTempUpdatedDateFrom] = useState<Date | null>(null);
  const [tempUpdatedDateTo, setTempUpdatedDateTo] = useState<Date | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  
  const [availableFilters, setAvailableFilters] = useState({
    machineType: true,
    status: true,
    lastReportDate: true,
    daysUntilReport: true,
    reportsCount: true,
    createdAt: true,
    updatedAt: true,
  });
  
  const [availableSorting, setAvailableSorting] = useState({
    created: true,
    name: true,
    status: true,
    type: true,
    serial: true,
    lastReport: true,
  });

  const loadDevices = async () => {
    const data = await getDevices();
    const interval = await getReportInterval();
    const reportsData = await AsyncStorage.getItem('@reports');
    const allReports = reportsData ? JSON.parse(reportsData) : [];
    
    let devicesWithStatus = await Promise.all(
      data.map(async (device) => {
        const lastReport = await getLastReport(device.id);
        const deviceReports = allReports.filter((r: any) => r.device_id === device.id);
        const reportsCount = deviceReports.length;
        
        let status = 'none';
        let daysUntilReport = null;
        
        if (lastReport) {
          const lastReportDate = new Date(lastReport.created_at);
          const now = new Date();
          
          const isSameDay = lastReportDate.toDateString() === now.toDateString();
          
          const daysDiff = Math.floor((now.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24));
          daysUntilReport = interval - daysDiff;
          
          if (isSameDay) {
            status = 'today';
          } else if (daysDiff > interval) {
            status = 'overdue';
          }
        } else {
          status = 'no-report';
          daysUntilReport = interval;
        }
        
        const hasQR = device.qr_code && device.qr_code.trim() !== '';
        const machineType = getMachineTypeById(device.machine_type_id);
        return { ...device, status, animKey: Date.now(), hasQR, machineType, reportsCount, daysUntilReport, lastReportDate: lastReport?.created_at };
      })
    );
    
    const maxReports = Math.max(...devicesWithStatus.map(d => d.reportsCount), 0);
    setMaxReportsCount(maxReports);
    
    const maxDays = Math.max(...devicesWithStatus.map(d => d.daysUntilReport || 0), 0);
    setMaxDaysUntilReport(maxDays);
    
    // Filters
    if (filterTypes.length > 0) {
      devicesWithStatus = devicesWithStatus.filter(d => filterTypes.includes(d.machine_type_id));
    }
    
    if (filterStatuses.length > 0) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        const matchesQR = filterStatuses.includes('no-qr') && !d.hasQR;
        const matchesStatus = filterStatuses.some(s => s !== 'no-qr' && s === d.status);
        return matchesQR || matchesStatus;
      });
    }
    
    if (lastReportDateFrom || lastReportDateTo) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (!d.lastReportDate) return false;
        const date = new Date(d.lastReportDate);
        if (lastReportDateFrom && date < lastReportDateFrom) return false;
        if (lastReportDateTo && date > lastReportDateTo) return false;
        return true;
      });
    }
    
    if (daysUntilReportMin !== null || daysUntilReportMax !== null) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (d.daysUntilReport === null) return false;
        if (daysUntilReportMin !== null && d.daysUntilReport < daysUntilReportMin) return false;
        if (daysUntilReportMax !== null && d.daysUntilReport > daysUntilReportMax) return false;
        return true;
      });
    }
    
    if (reportsCountMin !== null || reportsCountMax !== null) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (reportsCountMin !== null && d.reportsCount < reportsCountMin) return false;
        if (reportsCountMax !== null && d.reportsCount > reportsCountMax) return false;
        return true;
      });
    }
    
    if (createdDateFrom || createdDateTo) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        const date = new Date(d.created_at);
        if (createdDateFrom && date < createdDateFrom) return false;
        if (createdDateTo && date > createdDateTo) return false;
        return true;
      });
    }
    
    if (updatedDateFrom || updatedDateTo) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (!d.updated_at) return true;
        const date = new Date(d.updated_at);
        if (updatedDateFrom && date < updatedDateFrom) return false;
        if (updatedDateTo && date > updatedDateTo) return false;
        return true;
      });
    }
    
    // Sort
    if (sortBy === 'name') {
      devicesWithStatus.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } else if (sortBy === 'status') {
      devicesWithStatus.sort((a, b) => {
        const statusOrder = { 'overdue': 0, 'no-report': 1, 'today': 2, 'none': 3 };
        const aVal = (!a.hasQR ? -1 : statusOrder[a.status]);
        const bVal = (!b.hasQR ? -1 : statusOrder[b.status]);
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    } else if (sortBy === 'created') {
      devicesWithStatus.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'type') {
      devicesWithStatus.sort((a, b) => {
        const aName = a.machineType?.name || '';
        const bName = b.machineType?.name || '';
        return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    } else if (sortBy === 'serial') {
      devicesWithStatus.sort((a, b) => {
        const aSerial = a.serial_number || '';
        const bSerial = b.serial_number || '';
        return sortOrder === 'asc' ? aSerial.localeCompare(bSerial) : bSerial.localeCompare(aSerial);
      });
    } else if (sortBy === 'lastReport') {
      devicesWithStatus.sort((a, b) => {
        const aDate = a.lastReportDate ? new Date(a.lastReportDate).getTime() : 0;
        const bDate = b.lastReportDate ? new Date(b.lastReportDate).getTime() : 0;
        return sortOrder === 'desc' ? aDate - bDate : bDate - aDate;
      });
    }
    
    setDevices(devicesWithStatus);
  };

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        if (!machineTypesLoading) {
          await loadConfigs();
        }
      };
      init();
      NavigationBar.setVisibilityAsync('hidden');
    }, [machineTypesLoading])
  );
  
  useEffect(() => {
    if (!machineTypesLoading && isConfigLoadedRefresh) {
      loadDevices();
    }
  }, [isConfigLoadedRefresh, sortBy, sortOrder, filterTypes, filterStatuses, lastReportDateFrom, lastReportDateTo, daysUntilReportMin, daysUntilReportMax, reportsCountMin, reportsCountMax, createdDateFrom, createdDateTo, updatedDateFrom, updatedDateTo, machineTypesLoading]);
  
  useEffect(() => {
    if (showFilterModal) {
      calculatePreviewCount();
    }
  }, [tempFilterTypes, tempFilterStatuses, tempLastReportDateFrom, tempLastReportDateTo, tempDaysUntilReportMin, tempDaysUntilReportMax, tempReportsCountMin, tempReportsCountMax, tempCreatedDateFrom, tempCreatedDateTo, tempUpdatedDateFrom, tempUpdatedDateTo]);
  
  const activeFiltersCount = [
    filterTypes.length > 0,
    filterStatuses.length > 0,
    lastReportDateFrom !== null || lastReportDateTo !== null,
    daysUntilReportMin !== null || daysUntilReportMax !== null,
    reportsCountMin !== null || reportsCountMax !== null,
    createdDateFrom !== null || createdDateTo !== null,
    updatedDateFrom !== null || updatedDateTo !== null,
  ].filter(Boolean).length;
  
  const loadConfigs = async () => {
    const filtersConfig = await AsyncStorage.getItem('@machines_filters_config');
    const sortingConfig = await AsyncStorage.getItem('@machines_sorting_config');
    
    if (filtersConfig) {
      const newFilters = JSON.parse(filtersConfig);
      setAvailableFilters(newFilters);
      
      const newStatuses = filterStatuses.filter(s => {
        if (s === 'today' || s === 'overdue' || s === 'no-report' || s === 'no-qr' || s === 'none') return newFilters.status;
        return true;
      });
      if (newStatuses.length !== filterStatuses.length) setFilterStatuses(newStatuses);
      
      if (!newFilters.lastReportDate && (lastReportDateFrom || lastReportDateTo)) {
        setLastReportDateFrom(null);
        setLastReportDateTo(null);
      }
      if (!newFilters.daysUntilReport && (daysUntilReportMin !== null || daysUntilReportMax !== null)) {
        setDaysUntilReportMin(null);
        setDaysUntilReportMax(null);
      }
      if (!newFilters.reportsCount && (reportsCountMin !== null || reportsCountMax !== null)) {
        setReportsCountMin(null);
        setReportsCountMax(null);
      }
      if (!newFilters.createdAt && (createdDateFrom || createdDateTo)) {
        setCreatedDateFrom(null);
        setCreatedDateTo(null);
      }
      if (!newFilters.updatedAt && (updatedDateFrom || updatedDateTo)) {
        setUpdatedDateFrom(null);
        setUpdatedDateTo(null);
      }
      if (!newFilters.machineType && filterTypes.length > 0) {
        setFilterTypes([]);
      }
    }
    
    if (sortingConfig) {
      const newSorting = JSON.parse(sortingConfig);
      setAvailableSorting(newSorting);
      
      if (!newSorting[sortBy]) {
        const firstAvailable = Object.entries(newSorting).find(([_, value]) => value)?.[0];
        setSortBy((firstAvailable as any) || 'created');
      }
    }
    
    setIsConfigLoadedRefresh((prev) => prev + 1);
  };
  
  const calculatePreviewCount = async () => {
    const data = await getDevices();
    const interval = await getReportInterval();
    const reportsData = await AsyncStorage.getItem('@reports');
    const allReports = reportsData ? JSON.parse(reportsData) : [];
    
    let devicesWithStatus = await Promise.all(
      data.map(async (device) => {
        const lastReport = await getLastReport(device.id);
        const deviceReports = allReports.filter((r: any) => r.device_id === device.id);
        const reportsCount = deviceReports.length;
        
        let status = 'none';
        let daysUntilReport = null;
        
        if (lastReport) {
          const lastReportDate = new Date(lastReport.created_at);
          const now = new Date();
          const isSameDay = lastReportDate.toDateString() === now.toDateString();
          const daysDiff = Math.floor((now.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24));
          daysUntilReport = interval - daysDiff;
          
          if (isSameDay) {
            status = 'today';
          } else if (daysDiff > interval) {
            status = 'overdue';
          }
        } else {
          status = 'no-report';
          daysUntilReport = interval;
        }
        
        const hasQR = device.qr_code && device.qr_code.trim() !== '';
        const machineType = getMachineTypeById(device.machine_type_id);
        return { ...device, status, hasQR, machineType, reportsCount, daysUntilReport, lastReportDate: lastReport?.created_at };
      })
    );
    
    if (tempFilterTypes.length > 0) {
      devicesWithStatus = devicesWithStatus.filter(d => tempFilterTypes.includes(d.machine_type_id));
    }
    
    if (tempFilterStatuses.length > 0) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        const matchesQR = tempFilterStatuses.includes('no-qr') && !d.hasQR;
        const matchesStatus = tempFilterStatuses.some(s => s !== 'no-qr' && s === d.status);
        return matchesQR || matchesStatus;
      });
    }
    
    if (tempLastReportDateFrom || tempLastReportDateTo) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (!d.lastReportDate) return false;
        const date = new Date(d.lastReportDate);
        if (tempLastReportDateFrom && date < tempLastReportDateFrom) return false;
        if (tempLastReportDateTo && date > tempLastReportDateTo) return false;
        return true;
      });
    }
    
    if (tempDaysUntilReportMin !== null || tempDaysUntilReportMax !== null) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (d.daysUntilReport === null) return false;
        if (tempDaysUntilReportMin !== null && d.daysUntilReport < tempDaysUntilReportMin) return false;
        if (tempDaysUntilReportMax !== null && d.daysUntilReport > tempDaysUntilReportMax) return false;
        return true;
      });
    }
    
    if (tempReportsCountMin !== null || tempReportsCountMax !== null) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (tempReportsCountMin !== null && d.reportsCount < tempReportsCountMin) return false;
        if (tempReportsCountMax !== null && d.reportsCount > tempReportsCountMax) return false;
        return true;
      });
    }
    
    if (tempCreatedDateFrom || tempCreatedDateTo) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        const date = new Date(d.created_at);
        if (tempCreatedDateFrom && date < tempCreatedDateFrom) return false;
        if (tempCreatedDateTo && date > tempCreatedDateTo) return false;
        return true;
      });
    }
    
    if (tempUpdatedDateFrom || tempUpdatedDateTo) {
      devicesWithStatus = devicesWithStatus.filter(d => {
        if (!d.updated_at) return true;
        const date = new Date(d.updated_at);
        if (tempUpdatedDateFrom && date < tempUpdatedDateFrom) return false;
        if (tempUpdatedDateTo && date > tempUpdatedDateTo) return false;
        return true;
      });
    }
    
    setPreviewCount(devicesWithStatus.length);
  };
  
  const openFilterModal = () => {
    setTempFilterTypes(filterTypes);
    setTempFilterStatuses(filterStatuses);
    setTempLastReportDateFrom(lastReportDateFrom);
    setTempLastReportDateTo(lastReportDateTo);
    setTempDaysUntilReportMin(daysUntilReportMin);
    setTempDaysUntilReportMax(daysUntilReportMax);
    setTempReportsCountMin(reportsCountMin);
    setTempReportsCountMax(reportsCountMax);
    setTempCreatedDateFrom(createdDateFrom);
    setTempCreatedDateTo(createdDateTo);
    setTempUpdatedDateFrom(updatedDateFrom);
    setTempUpdatedDateTo(updatedDateTo);
    setShowFilterModal(true);
  };
  
  const applyFilters = async () => {
    setFilterTypes(tempFilterTypes);
    setFilterStatuses(tempFilterStatuses);
    setLastReportDateFrom(tempLastReportDateFrom);
    setLastReportDateTo(tempLastReportDateTo);
    setDaysUntilReportMin(tempDaysUntilReportMin);
    setDaysUntilReportMax(tempDaysUntilReportMax);
    setReportsCountMin(tempReportsCountMin);
    setReportsCountMax(tempReportsCountMax);
    setCreatedDateFrom(tempCreatedDateFrom);
    setCreatedDateTo(tempCreatedDateTo);
    setUpdatedDateFrom(tempUpdatedDateFrom);
    setUpdatedDateTo(tempUpdatedDateTo);
    
    await AsyncStorage.setItem('@filter_types', JSON.stringify(tempFilterTypes));
    await AsyncStorage.setItem('@filter_statuses', JSON.stringify(tempFilterStatuses));
    await AsyncStorage.setItem('@last_report_date_from', tempLastReportDateFrom ? tempLastReportDateFrom.toISOString() : '');
    await AsyncStorage.setItem('@last_report_date_to', tempLastReportDateTo ? tempLastReportDateTo.toISOString() : '');
    await AsyncStorage.setItem('@days_until_report_min', tempDaysUntilReportMin !== null ? String(tempDaysUntilReportMin) : '');
    await AsyncStorage.setItem('@days_until_report_max', tempDaysUntilReportMax !== null ? String(tempDaysUntilReportMax) : '');
    await AsyncStorage.setItem('@reports_count_min', tempReportsCountMin !== null ? String(tempReportsCountMin) : '');
    await AsyncStorage.setItem('@reports_count_max', tempReportsCountMax !== null ? String(tempReportsCountMax) : '');
    await AsyncStorage.setItem('@created_date_from', tempCreatedDateFrom ? tempCreatedDateFrom.toISOString() : '');
    await AsyncStorage.setItem('@created_date_to', tempCreatedDateTo ? tempCreatedDateTo.toISOString() : '');
    await AsyncStorage.setItem('@updated_date_from', tempUpdatedDateFrom ? tempUpdatedDateFrom.toISOString() : '');
    await AsyncStorage.setItem('@updated_date_to', tempUpdatedDateTo ? tempUpdatedDateTo.toISOString() : '');
    
    setShowFilterModal(false);
  };
  
  const clearAllFilters = () => {
    setTempFilterTypes([]);
    setTempFilterStatuses([]);
    setTempLastReportDateFrom(null);
    setTempLastReportDateTo(null);
    setTempDaysUntilReportMin(null);
    setTempDaysUntilReportMax(null);
    setTempReportsCountMin(null);
    setTempReportsCountMax(null);
    setTempCreatedDateFrom(null);
    setTempCreatedDateTo(null);
    setTempUpdatedDateFrom(null);
    setTempUpdatedDateTo(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={[styles.controlsTable, { backgroundColor: Colors[colorScheme].card, borderBottomColor: Colors[colorScheme].border }]}>
        <TouchableOpacity 
          style={styles.controlCell}
          onPress={() => {
            setTempSortBy(sortBy);
            setTempSortOrder(sortOrder);
            setShowSortModal(true);
          }}
        >
          <View style={styles.controlContent}>
            <MaterialIcons name="sort" size={30} color={Colors[colorScheme].icon} />
            <View style={styles.controlTextContainer}>
              <Text style={[styles.controlButtonText, { color: Colors[colorScheme].text }]}>{t('sort')}</Text>
              <View style={styles.sortSubtextRow}>
                <Text style={[styles.sortSubtext, { color: Colors[colorScheme].icon }]} numberOfLines={1}>
                  {t(`sortBy${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`)}
                </Text>
                <MaterialIcons name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} size={12} color={Colors[colorScheme].icon} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: Colors[colorScheme].border }]} />
        
        <TouchableOpacity 
          style={styles.controlCell}
          onPress={openFilterModal}
        >
          <View style={styles.controlContent}>
            <MaterialIcons name="filter-list" size={30} color={Colors[colorScheme].icon} />
            <View style={styles.controlTextContainer}>
              <Text style={[styles.controlButtonText, { color: Colors[colorScheme].text }]}>{t('filter')}</Text>
            </View>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
            activeOpacity={0.7}
            onPress={() => navigate(() => router.push({
              pathname: '/device-details',
              params: {
                ...item,
                machine_type_id: item.machine_type_id,
                serial_number: item.serial_number,
              },
            }))}
            disabled={isNavigating}
          >
            {!item.hasQR && (
              <LinearGradient
                colors={['transparent', 'rgba(239, 68, 68, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.hasQR && item.status === 'today' && (
              <LinearGradient
                colors={['transparent', 'rgba(34, 197, 94, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.hasQR && item.status === 'overdue' && (
              <LinearGradient
                colors={['transparent', 'rgba(249, 115, 22, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.hasQR && item.status === 'no-report' && (
              <LinearGradient
                colors={['transparent', 'rgba(234, 179, 8, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0.3, 1]}
                style={styles.gradient}
              />
            )}
            {item.machineType && item.machineType.color && item.machineType.icon && (
              <View style={[styles.typeIndicator, { backgroundColor: item.machineType.color, borderColor: getDarkerColor(item.machineType.color) }]}>
                <MaterialIcons name={item.machineType.icon} size={30} color="#fff" />
              </View>
            )}
            {item.image_thumbnail && (
              <View style={styles.thumbnailContainer}>
                <Image source={{ uri: item.image_thumbnail }} style={styles.thumbnailImage} resizeMode="cover" />
              </View>
            )}
            <View style={[styles.textContainer, { marginLeft: item.image_thumbnail ? '28%' : (item.machineType?.color && item.machineType?.icon ? '15%' : 20) }]}>
              <Text style={[styles.itemName, { color: Colors[colorScheme].text }]}>{item.name}</Text>
              {item.serial_number && (
                <Text style={[styles.serialNumber, { color: Colors[colorScheme].icon }]}>{item.serial_number}</Text>
              )}
            </View>
            <View style={styles.iconRow}>
              {!item.hasQR && <NoQRIcon />}
              {item.status !== 'none' && <AnimatedStatusIcon key={item.animKey} status={item.status} />}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: Colors[colorScheme].icon }]}>{t('noDevicesYet')}</Text>
        }
      />
      <ScanButton />
      
      <Modal visible={showSortModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: Colors[colorScheme].card }]}>
            <View style={[styles.filterHeader, { borderBottomColor: Colors[colorScheme].border }]}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>{t('sorting')}</Text>
            </View>
            
            <View style={styles.sortBySection}>
              <Text style={[styles.sortSectionTitle, { color: Colors[colorScheme].text }]}>{t('sortBy')}</Text>
              <View style={styles.sortByButtons}>
                {availableSorting.created && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'created' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('created')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'created' && { color: '#fff', fontWeight: '700' }]}>{t('sortByCreated')}</Text>
                  </TouchableOpacity>
                )}
                {availableSorting.name && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'name' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('name')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'name' && { color: '#fff', fontWeight: '700' }]}>{t('sortByName')}</Text>
                  </TouchableOpacity>
                )}
                {availableSorting.status && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'status' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('status')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'status' && { color: '#fff', fontWeight: '700' }]}>{t('status')}</Text>
                  </TouchableOpacity>
                )}
                {availableSorting.type && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'type' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('type')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'type' && { color: '#fff', fontWeight: '700' }]}>{t('sortByType')}</Text>
                  </TouchableOpacity>
                )}
                {availableSorting.serial && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'serial' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('serial')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'serial' && { color: '#fff', fontWeight: '700' }]}>{t('sortBySerial')}</Text>
                  </TouchableOpacity>
                )}
                {availableSorting.lastReport && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'lastReport' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('lastReport')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'lastReport' && { color: '#fff', fontWeight: '700' }]}>{t('sortByLastReport')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={[styles.sortOrderSection, { borderTopColor: Colors[colorScheme].border }]}>
              <Text style={[styles.sortOrderLabel, { color: Colors[colorScheme].text }]}>{t('sortOrder')}</Text>
              <View style={styles.sortOrderButtons}>
                <TouchableOpacity
                  style={[styles.sortOrderButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortOrder === 'asc' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                  onPress={() => setTempSortOrder('asc')}
                >
                  <MaterialIcons name="arrow-upward" size={20} color={tempSortOrder === 'asc' ? '#fff' : Colors[colorScheme].icon} />
                  <Text style={[styles.sortOrderButtonText, { color: Colors[colorScheme].text }, tempSortOrder === 'asc' && { color: '#fff', fontWeight: '700' }]}>{t('ascending')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortOrderButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortOrder === 'desc' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                  onPress={() => setTempSortOrder('desc')}
                >
                  <MaterialIcons name="arrow-downward" size={20} color={tempSortOrder === 'desc' ? '#fff' : Colors[colorScheme].icon} />
                  <Text style={[styles.sortOrderButtonText, { color: Colors[colorScheme].text }, tempSortOrder === 'desc' && { color: '#fff', fontWeight: '700' }]}>{t('descending')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.filterFooter, { borderTopColor: Colors[colorScheme].border }]}>
              <TouchableOpacity 
                style={[styles.filterFooterButton, { borderColor: Colors[colorScheme].border }]} 
                onPress={() => setShowSortModal(false)}
              >
                <Text style={[styles.filterFooterButtonText, { color: Colors[colorScheme].text }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterFooterButton, { backgroundColor: Colors[colorScheme].tint }]} 
                onPress={async () => {
                  setSortBy(tempSortBy);
                  setSortOrder(tempSortOrder);
                  await AsyncStorage.setItem('@sort_by', tempSortBy);
                  await AsyncStorage.setItem('@sort_order', tempSortOrder);
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.filterFooterButtonText, { color: '#fff' }]}>{t('apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: Colors[colorScheme].card }]}>
            <View style={[styles.filterHeader, { borderBottomColor: Colors[colorScheme].border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>{t('filters')}</Text>
                <Text style={[styles.previewText, { color: Colors[colorScheme].icon }]}>
                  {t('found')} <Text style={{ color: Colors[colorScheme].tint, fontWeight: '700' }}>{previewCount}</Text> {previewCount === 0 ? t('machines_zero') : previewCount === 1 ? t('machines_one') : t('machines_other')}
                </Text>
              </View>
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={[styles.clearAllText, { color: Colors[colorScheme].tint }]}>{t('clearAll')}</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterScroll}>
              {availableFilters.machineType && (
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: Colors[colorScheme].text }]}>{t('machineType')}</Text>
                {machineTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.checkboxItem, { borderBottomColor: Colors[colorScheme].border }]}
                    onPress={() => {
                      setTempFilterTypes(prev => 
                        prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                      );
                    }}
                  >
                    <View style={styles.checkboxRow}>
                      {type.color && type.icon && (
                        <View style={[styles.typePreview, { backgroundColor: type.color }]}>
                          <MaterialIcons name={type.icon} size={16} color="#fff" />
                        </View>
                      )}
                      <Text style={[styles.checkboxText, { color: Colors[colorScheme].text }]}>{type.name}</Text>
                    </View>
                    <MaterialIcons 
                      name={tempFilterTypes.includes(type.id) ? 'check-box' : 'check-box-outline-blank'} 
                      size={24} 
                      color={tempFilterTypes.includes(type.id) ? Colors[colorScheme].tint : Colors[colorScheme].icon} 
                    />
                  </TouchableOpacity>
                ))}
                </View>
              )}
              
              {availableFilters.status && (
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: Colors[colorScheme].text }]}>{t('status')}</Text>
                {['today', 'overdue', 'no-report', 'no-qr', 'none'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.checkboxItem, { borderBottomColor: Colors[colorScheme].border }]}
                    onPress={() => {
                      setTempFilterStatuses(prev => 
                        prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                      );
                    }}
                  >
                    <Text style={[styles.checkboxText, { color: Colors[colorScheme].text }]}>{t(`status_${status}`)}</Text>
                    <MaterialIcons 
                      name={tempFilterStatuses.includes(status) ? 'check-box' : 'check-box-outline-blank'} 
                      size={24} 
                      color={tempFilterStatuses.includes(status) ? Colors[colorScheme].tint : Colors[colorScheme].icon} 
                    />
                  </TouchableOpacity>
                ))}
                </View>
              )}
              
              {availableFilters.lastReportDate && (
                <View style={styles.filterSection}>
                  <DateRangePicker
                    label={t('lastReportDate')}
                    startDate={tempLastReportDateFrom}
                    endDate={tempLastReportDateTo}
                    onStartDateChange={setTempLastReportDateFrom}
                    onEndDateChange={setTempLastReportDateTo}
                    colorScheme={colorScheme}
                  />
                </View>
              )}
              
              {availableFilters.daysUntilReport && (
                <View style={styles.filterSection}>
                  <NumberRangePicker
                    label={t('daysUntilReport')}
                    min={tempDaysUntilReportMin}
                    max={tempDaysUntilReportMax}
                    onMinChange={setTempDaysUntilReportMin}
                    onMaxChange={setTempDaysUntilReportMax}
                    colorScheme={colorScheme}
                    minLimit={0}
                    maxLimit={maxDaysUntilReport}
                  />
                </View>
              )}
              
              {availableFilters.reportsCount && (
                <View style={styles.filterSection}>
                  <NumberRangePicker
                    label={t('reportsCount')}
                    min={tempReportsCountMin}
                    max={tempReportsCountMax}
                    onMinChange={setTempReportsCountMin}
                    onMaxChange={setTempReportsCountMax}
                    colorScheme={colorScheme}
                    minLimit={0}
                    maxLimit={maxReportsCount}
                  />
                </View>
              )}
              
              {availableFilters.createdAt && (
                <View style={styles.filterSection}>
                  <DateRangePicker
                    label={t('createdAt')}
                    startDate={tempCreatedDateFrom}
                    endDate={tempCreatedDateTo}
                    onStartDateChange={setTempCreatedDateFrom}
                    onEndDateChange={setTempCreatedDateTo}
                    colorScheme={colorScheme}
                  />
                </View>
              )}
              
              {availableFilters.updatedAt && (
                <View style={styles.filterSection}>
                  <DateRangePicker
                    label={t('updatedAt')}
                    startDate={tempUpdatedDateFrom}
                    endDate={tempUpdatedDateTo}
                    onStartDateChange={setTempUpdatedDateFrom}
                    onEndDateChange={setTempUpdatedDateTo}
                    colorScheme={colorScheme}
                  />
                </View>
              )}
            </ScrollView>
            
            <View style={[styles.filterFooter, { borderTopColor: Colors[colorScheme].border }]}>
              <TouchableOpacity 
                style={[styles.filterFooterButton, { borderColor: Colors[colorScheme].border }]} 
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.filterFooterButtonText, { color: Colors[colorScheme].text }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterFooterButton, { backgroundColor: Colors[colorScheme].tint }]} 
                onPress={applyFilters}
              >
                <Text style={[styles.filterFooterButtonText, { color: '#fff' }]}>{t('apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsTable: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  controlContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    width: 1,
  },
  controlTextContainer: {
    alignItems: 'flex-start',
  },
  sortSubtext: {
    fontSize: 12,
  },
  sortSubtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  filterBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  item: {
    padding: 20,
    marginHorizontal: 24,
    paddingLeft: 0,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  typeIndicator: {
    width: '12%',
    position: 'absolute',
    left: -1,
    top: -1,
    bottom: -1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderRightWidth: 2,
    zIndex: 1,
  },
  thumbnailContainer: {
    position: 'absolute',
    left: '11.8%',
    top: -1,
    bottom: -1,
    aspectRatio: 0.5,
    overflow: 'hidden',
    zIndex: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    pointerEvents: 'none',
    zIndex: 0,
  },
  textContainer: {
    flex: 1,
    zIndex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
  },
  serialNumber: {
    fontSize: 14,
    marginTop: 4,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    marginHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 120,
  },

  filterModalContent: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 20,
    borderRadius: 20,
    maxHeight: '85%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
  },
  previewText: {
    fontSize: 13,
    marginTop: 4,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterScroll: {
    maxHeight: '70%',
  },
  filterSection: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalItem: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  sortOrderSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    marginTop: 10,
  },
  sortOrderLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sortOrderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sortOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalItemText: {
    fontSize: 18,
  },
  filterFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 2,
  },
  sortBySection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sortSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sortByButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortByButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortByButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterFooterButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  filterFooterButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  typePreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
