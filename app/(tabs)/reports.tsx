import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated, Modal, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { getReports, getDevices } from '@/lib/database';
import { useMachineTypes } from '@/contexts/machine-types-context';
import ScanButton from '@/components/scan-button';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useNavigation } from '@/contexts/navigation-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateRangePicker from '@/components/filters/DateRangePicker';

function ReportItem({ item, colorScheme, navigate, router, isNavigating, machineType }: any) {
  const scaleAnim = useState(() => new Animated.Value(1))[0];
  
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isTodayReport = isToday(item.created_at);
  
  useEffect(() => {
    if (isTodayReport) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isTodayReport]);
  
  return (
    <View style={styles.itemWrapper}>
      <TouchableOpacity
        style={[styles.item, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}
        onPress={() => navigate(() => router.push({
          pathname: '/report-details',
          params: item,
        }))}
        disabled={isNavigating}
      >
        <View style={styles.deviceNameRow}>
          <Text style={[styles.itemDevice, { color: Colors[colorScheme].tint }]}>{item.device_name}</Text>
          {machineType && machineType.color && machineType.icon && (
            <View style={[styles.machineTypeIcon, { backgroundColor: machineType.color }]}>
              <MaterialIcons name={machineType.icon} size={20} color="#fff" />
            </View>
          )}
        </View>
        <Text style={[styles.itemDescription, { color: Colors[colorScheme].text }]}>{item.description}</Text>
        <Text style={[styles.itemDate, { color: Colors[colorScheme].icon }]}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
        {isTodayReport && (
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <MaterialIcons name="check-circle" size={32} color="#22c55e" />
          </Animated.View>
        )}
      </TouchableOpacity>
      {isTodayReport && (
        <LinearGradient
          colors={['transparent', 'rgba(34, 197, 94, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0.3, 1]}
          style={styles.gradient}
        />
      )}
    </View>
  );
}

export default function ReportsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { navigate, isNavigating } = useNavigation();
  const { getMachineTypeById, machineTypes, isLoading: machineTypesLoading } = useMachineTypes();
  const [reports, setReports] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'machineType'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tempSortBy, setTempSortBy] = useState<'date' | 'machineType'>('date');
  const [tempSortOrder, setTempSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filterMachineTypes, setFilterMachineTypes] = useState<number[]>([]);
  const [filterReportedToday, setFilterReportedToday] = useState(false);
  const [reportDateFrom, setReportDateFrom] = useState<Date | null>(null);
  const [reportDateTo, setReportDateTo] = useState<Date | null>(null);
  
  const [tempFilterMachineTypes, setTempFilterMachineTypes] = useState<number[]>([]);
  const [tempFilterReportedToday, setTempFilterReportedToday] = useState(false);
  const [tempReportDateFrom, setTempReportDateFrom] = useState<Date | null>(null);
  const [tempReportDateTo, setTempReportDateTo] = useState<Date | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  
  const [devices, setDevices] = useState<any[]>([]);
  const [availableFilters, setAvailableFilters] = useState({
    machineType: true,
    date: true,
    reportedToday: true,
  });
  const [availableSorting, setAvailableSorting] = useState({
    date: true,
    machineType: true,
  });

  const loadReports = async () => {
    let data = await getReports();
    
    if (filterMachineTypes.length > 0) {
      const devicesData = await getDevices();
      const deviceIds = devicesData.filter(d => filterMachineTypes.includes(d.machine_type_id)).map(d => d.id);
      data = data.filter(r => deviceIds.includes(r.device_id));
    }
    
    if (filterReportedToday) {
      data = data.filter(r => {
        const date = new Date(r.created_at);
        const today = new Date();
        return date.toDateString() === today.toDateString();
      });
    }
    
    if (reportDateFrom || reportDateTo) {
      data = data.filter(r => {
        const date = new Date(r.created_at);
        if (reportDateFrom && date < reportDateFrom) return false;
        if (reportDateTo && date > reportDateTo) return false;
        return true;
      });
    }
    
    if (sortBy === 'machineType') {
      const devicesData = await getDevices();
      data.sort((a, b) => {
        const deviceA = devicesData.find(d => d.id === a.device_id);
        const deviceB = devicesData.find(d => d.id === b.device_id);
        const typeA = getMachineTypeById(deviceA?.machine_type_id)?.name || '';
        const typeB = getMachineTypeById(deviceB?.machine_type_id)?.name || '';
        return sortOrder === 'asc' ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
      });
    } else {
      data.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    
    setReports(data);
  };
  
  const loadDevices = async () => {
    const data = await getDevices();
    setDevices(data);
  };
  
  const loadConfigs = async () => {
    const filtersConfig = await AsyncStorage.getItem('@reports_filters_config');
    const sortingConfig = await AsyncStorage.getItem('@reports_sorting_config');
    
    if (filtersConfig) {
      const newFilters = JSON.parse(filtersConfig);
      setAvailableFilters(newFilters);
      
      if (!newFilters.machineType && filterMachineTypes.length > 0) setFilterMachineTypes([]);
      if (!newFilters.reportedToday && filterReportedToday) setFilterReportedToday(false);
      if (!newFilters.date && (reportDateFrom || reportDateTo)) {
        setReportDateFrom(null);
        setReportDateTo(null);
      }
    }
    
    if (sortingConfig) {
      const newSorting = JSON.parse(sortingConfig);
      setAvailableSorting(newSorting);
      
      if (!newSorting[sortBy]) {
        const firstAvailable = Object.entries(newSorting).find(([_, value]) => value)?.[0];
        setSortBy((firstAvailable as any) || 'date');
      }
    }

    setIsConfigLoaded(true);
  };
  
  const calculatePreviewCount = async () => {
    let data = await getReports();
    
    if (tempFilterMachineTypes.length > 0) {
      const devicesData = await getDevices();
      const deviceIds = devicesData.filter(d => tempFilterMachineTypes.includes(d.machine_type_id)).map(d => d.id);
      data = data.filter(r => deviceIds.includes(r.device_id));
    }
    
    if (tempFilterReportedToday) {
      data = data.filter(r => {
        const date = new Date(r.created_at);
        const today = new Date();
        return date.toDateString() === today.toDateString();
      });
    }
    
    if (tempReportDateFrom || tempReportDateTo) {
      data = data.filter(r => {
        const date = new Date(r.created_at);
        if (tempReportDateFrom && date < tempReportDateFrom) return false;
        if (tempReportDateTo && date > tempReportDateTo) return false;
        return true;
      });
    }
    
    setPreviewCount(data.length);
  };

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        if (!machineTypesLoading) {
          await loadConfigs();
          if (isConfigLoaded) {
            loadDevices();
            loadReports();
          }
        }
      };
      init();
      setRefreshKey(prev => prev + 1);
    }, [machineTypesLoading, isConfigLoaded])
  );
  
  useEffect(() => {
    if (!machineTypesLoading && isConfigLoaded) {
      loadDevices();
      loadReports();
    }
  }, [machineTypesLoading, isConfigLoaded, sortBy, sortOrder, filterMachineTypes, filterReportedToday, reportDateFrom, reportDateTo]);
  
  useEffect(() => {
    if (showFilterModal) {
      calculatePreviewCount();
    }
  }, [tempFilterMachineTypes, tempFilterReportedToday, tempReportDateFrom, tempReportDateTo]);
  
  const activeFiltersCount = [
    filterMachineTypes.length > 0,
    filterReportedToday,
    reportDateFrom !== null || reportDateTo !== null,
  ].filter(Boolean).length;
  
  const openFilterModal = () => {
    setTempFilterMachineTypes(filterMachineTypes);
    setTempFilterReportedToday(filterReportedToday);
    setTempReportDateFrom(reportDateFrom);
    setTempReportDateTo(reportDateTo);
    setShowFilterModal(true);
  };
  
  const applyFilters = async () => {
    setFilterMachineTypes(tempFilterMachineTypes);
    setFilterReportedToday(tempFilterReportedToday);
    setReportDateFrom(tempReportDateFrom);
    setReportDateTo(tempReportDateTo);
    
    await AsyncStorage.setItem('@filter_report_machine_types', JSON.stringify(tempFilterMachineTypes));
    await AsyncStorage.setItem('@filter_reported_today', String(tempFilterReportedToday));
    await AsyncStorage.setItem('@filter_report_date_from', tempReportDateFrom ? tempReportDateFrom.toISOString() : '');
    await AsyncStorage.setItem('@filter_report_date_to', tempReportDateTo ? tempReportDateTo.toISOString() : '');
    
    setShowFilterModal(false);
  };
  
  const clearAllFilters = () => {
    setTempFilterMachineTypes([]);
    setTempFilterReportedToday(false);
    setTempReportDateFrom(null);
    setTempReportDateTo(null);
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
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const device = devices.find(d => d.id === item.device_id);
          const machineType = device ? getMachineTypeById(device.machine_type_id) : null;
          return (
            <ReportItem 
              key={`${item.id}-${refreshKey}`}
              item={item} 
              colorScheme={colorScheme} 
              navigate={navigate} 
              router={router} 
              isNavigating={isNavigating}
              machineType={machineType}
            />
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: Colors[colorScheme].icon }]}>{t('noReportsYet')}</Text>
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
                {availableSorting.date && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'date' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('date')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'date' && { color: '#fff', fontWeight: '700' }]}>{t('sortByDate')}</Text>
                  </TouchableOpacity>
                )}
                {availableSorting.machineType && (
                  <TouchableOpacity
                    style={[styles.sortByButton, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }, tempSortBy === 'machineType' && { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint }]}
                    onPress={() => setTempSortBy('machineType')}
                  >
                    <Text style={[styles.sortByButtonText, { color: Colors[colorScheme].text }, tempSortBy === 'machineType' && { color: '#fff', fontWeight: '700' }]}>{t('sortByMachineType')}</Text>
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
                  await AsyncStorage.setItem('@sort_reports_by', tempSortBy);
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
                  {t('found')} <Text style={{ color: Colors[colorScheme].tint, fontWeight: '700' }}>{previewCount}</Text> {previewCount === 0 ? t('reports_zero') : previewCount === 1 ? t('reports_one') : t('reports_other')}
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
                        setTempFilterMachineTypes(prev => 
                          prev.includes(type.id) ? prev.filter(id => id !== type.id) : [...prev, type.id]
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
                        name={tempFilterMachineTypes.includes(type.id) ? 'check-box' : 'check-box-outline-blank'} 
                        size={24} 
                        color={tempFilterMachineTypes.includes(type.id) ? Colors[colorScheme].tint : Colors[colorScheme].icon} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {availableFilters.reportedToday && (
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: Colors[colorScheme].text }]}>{t('status')}</Text>
                <View style={styles.filterSection}>
                  <TouchableOpacity
                    style={[styles.checkboxItem, { borderBottomColor: Colors[colorScheme].border }]}
                    onPress={() => setTempFilterReportedToday(!tempFilterReportedToday)}
                  >
                    <Text style={[styles.checkboxText, { color: Colors[colorScheme].text }]}>{t('reportedToday')}</Text>
                    <MaterialIcons 
                      name={tempFilterReportedToday ? 'check-box' : 'check-box-outline-blank'} 
                      size={24} 
                      color={tempFilterReportedToday ? Colors[colorScheme].tint : Colors[colorScheme].icon} 
                    />
                  </TouchableOpacity>
                </View>
                </View>
              )}
              
              {availableFilters.date && (
                <View style={styles.filterSection}>
                  <DateRangePicker
                    label={t('date')}
                    startDate={tempReportDateFrom}
                    endDate={tempReportDateTo}
                    onStartDateChange={setTempReportDateFrom}
                    onEndDateChange={setTempReportDateTo}
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
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
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
  itemWrapper: {
    position: 'relative',
    marginBottom: 16,
    marginHorizontal: 24,
  },
  item: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    pointerEvents: 'none',
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemDevice: {
    fontSize: 18,
    fontWeight: '700',
  },
  machineTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
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
    borderBottomColor: '#e5e7eb',
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
  checkboxText: {
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typePreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
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
  filterFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
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
});
