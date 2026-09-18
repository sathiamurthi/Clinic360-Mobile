import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, TouchableWithoutFeedback, Linking, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL = 'https://project--7b00890a-3832-46ed-a91b-f2c53975e112.lovable.app/api/public/v1';

type Status = 'Waiting' | 'Serving' | 'Done';

type Doctor = { id: string; name: string; specialization: string; };

type PatientToken = {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientMobile: string;
  status: Status;
  scheduledTime?: string;
  doctorId: string;
  scheduledDay?: string;
};

type ClinicInfo = {
  id: string;
  name: string;
  mobile: string;
};

/* -------------------------------------------------------------------------- */
/* AUTHENTICATION SCREEN (Sign In / Create Account)                           */
/* -------------------------------------------------------------------------- */
export function AuthScreen({ onLogin }: { onLogin: (role: 'clinic' | 'patient', clinic?: any, mobile?: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<'clinic' | 'patient'>('clinic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/clinics`)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data?.clinics) ? data.clinics : (Array.isArray(data) ? data : []);
        setClinics(arr);
        if (arr.length > 0) setSelectedClinicId(arr[0].id);
      })
      .catch(e => console.log('Failed to fetch clinics', e));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        if (!email || !password) throw new Error("Please enter email and password");
        if (accountType === 'patient' && !mobile) throw new Error("Please enter your mobile number");
        
        if (accountType === 'clinic') {
          let availableClinics = clinics;
          if (availableClinics.length === 0) {
            try {
              const r = await fetch(`${BASE_URL}/clinics`);
              const d = await r.json();
              availableClinics = Array.isArray(d?.clinics) ? d.clinics : (Array.isArray(d) ? d : []);
            } catch(e) { console.log(e); }
          }
          const clinicObj = availableClinics.find(c => c.id === selectedClinicId) || availableClinics[0] || { id: 'clinic-123', name: 'Demo Clinic', mobile: '9999999999' };
          onLogin('clinic', clinicObj);
        } else {
          onLogin('patient', undefined, mobile);
        }
      } else {
        if (!email || !password || !fullName || !mobile || !username) {
          throw new Error("Please fill in all fields");
        }
        
        if (accountType === 'clinic') {
          const res = await fetch(`${BASE_URL}/clinics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fullName, mobile })
          });
          
          let data: any = {};
          let rawText = '';
          try {
            rawText = await res.text();
            data = rawText ? JSON.parse(rawText) : {};
          } catch (e) {
            console.log('Non-JSON response', e);
          }

          if (!res.ok) throw new Error(`API Error (${res.status}): ${data.message || data.error || rawText || 'Failed to register clinic'}`);
          
          const newClinic = { id: data.id || `clinic-${Date.now()}`, name: fullName, mobile };
          if (Platform.OS === 'web') {
            window.alert('Clinic account created successfully!');
            onLogin('clinic', newClinic);
          } else {
            Alert.alert('Success', 'Clinic account created!', [{ text: 'OK', onPress: () => onLogin('clinic', newClinic) }]);
          }
        } else {
          if (Platform.OS === 'web') {
            window.alert('Patient account created successfully!');
            onLogin('patient');
          } else {
            Alert.alert('Success', 'Patient account created!', [{ text: 'OK', onPress: () => onLogin('patient') }]);
          }
        }
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message);
      } else {
        Alert.alert('Error', err.message);
      }
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.authContainer}>
        <Text style={styles.authBrand}>← Clinic360</Text>
        
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>{isLogin ? 'Sign in' : 'Create your account'}</Text>
          <Text style={styles.authSubtitle}>
            {isLogin ? 'Clinic staff, patients and provider admins.' : 'Pick a username and sign in with your email and password.'}
          </Text>

          <Text style={styles.inputLabel}>Account type</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, accountType === 'patient' && styles.toggleBtnActive]} 
              onPress={() => setAccountType('patient')}
            >
              <Text style={[styles.toggleBtnText, accountType === 'patient' && styles.toggleBtnTextActive]}>Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, accountType === 'clinic' && styles.toggleBtnActive]} 
              onPress={() => setAccountType('clinic')}
            >
              <Text style={[styles.toggleBtnText, accountType === 'clinic' && styles.toggleBtnTextActive]}>Clinic staff</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput style={styles.input} placeholder="e.g. sunrise-clinic" value={username} onChangeText={setUsername} autoCapitalize="none" />

              <Text style={styles.inputLabel}>Full name</Text>
              <TextInput style={styles.input} placeholder="e.g. Sunrise Clinic" value={fullName} onChangeText={setFullName} />
            </>
          )}
          {(!isLogin || accountType === 'patient') && (
            <>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput style={styles.input} placeholder="9876543210" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
            </>
          )}

          {((accountType === 'patient' && !isLogin) || (accountType === 'clinic' && isLogin)) && clinics.length > 0 && (
            <>
              <Text style={styles.inputLabel}>Select Clinic {accountType === 'patient' ? '(Optional)' : ''}</Text>
              <ScrollView style={{ maxHeight: 100, marginBottom: 15 }} nestedScrollEnabled>
                {clinics.map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.clinicSelectBtn, selectedClinicId === c.id && styles.clinicSelectBtnActive]}
                    onPress={() => setSelectedClinicId(c.id)}
                  >
                    <Text style={selectedClinicId === c.id ? {color: '#0F766E', fontWeight: 'bold'} : {color: '#374151'}}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={styles.authSubmitBtn} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.authSubmitBtnText}>{loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}</Text>
          </TouchableOpacity>

          <View style={styles.authFooter}>
            <Text style={styles.authFooterText}>
              {isLogin ? 'New here? ' : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.authFooterLink}>{isLogin ? 'Create an account' : 'Sign in'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* PATIENT STATUS SCREEN                                                      */
/* -------------------------------------------------------------------------- */
function PatientScreen({ activeClinicId, onBack, patientMobile }: { activeClinicId: string | null, onBack: () => void, patientMobile: string }) {
  const [searchToken, setSearchToken] = useState('');
  const [searchMobile, setSearchMobile] = useState(patientMobile);
  const [clinicId, setClinicId] = useState(activeClinicId || '');
  const [clinicsWithDoctors, setClinicsWithDoctors] = useState<any[]>([]);
  const [myPatient, setMyPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${BASE_URL}/clinics`);
        let data = await res.json();
        let clinics = Array.isArray(data?.clinics) ? data.clinics : (Array.isArray(data) ? data : []);
        
        if (clinics.length === 0) {
          clinics = [{ id: 'clinic-123', name: 'Demo Clinic', mobile: '9999999999' }];
        }

        let combined: any[] = [];
        for (const c of clinics) {
          try {
            const docRes = await fetch(`${BASE_URL}/clinics/${c.id}/doctors`);
            const docs = await docRes.json();
            if (Array.isArray(docs) && docs.length > 0) {
              docs.forEach(d => {
                combined.push({
                  clinicId: c.id,
                  doctorId: d.id,
                  label: `${c.name} - ${d.name} - ${d.specialization || 'General'}`
                });
              });
            } else {
              combined.push({ clinicId: c.id, doctorId: null, label: `${c.name} - No doctors yet` });
            }
          } catch (e) {
            combined.push({ clinicId: c.id, doctorId: null, label: `${c.name}` });
          }
        }
        setClinicsWithDoctors(combined.length > 0 ? combined : [{ clinicId: 'clinic-123', doctorId: 'doc-1', label: 'Demo Clinic - Dr. Smith - General' }]);
      } catch (e) {
        setClinicsWithDoctors([{ clinicId: 'clinic-123', doctorId: 'doc-1', label: 'Demo Clinic - Dr. Smith - General' }]);
      }
    };
    fetchAll();
  }, []);

  const checkStatus = async () => {
    if (!clinicId.trim() || !searchMobile.trim() || !searchToken.trim()) {
      Alert.alert('Error', 'Please select a Clinic, enter Mobile Number, and Token ID.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/patients/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, mobile: searchMobile.trim(), tokenNumber: searchToken.trim() })
      });
      if (!res.ok) throw new Error('Could not find token details. Check your credentials.');
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setMyPatient(data); // Expecting { status, peopleAhead, nextVisit, ... }
    } catch (err: any) {
      Alert.alert('Not Found', err.message || 'Invalid Token or Mobile Number.');
      setMyPatient(null);
    }
    setLoading(false);
  };

  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.clinicName}>Patient Portal</Text>
        <TouchableOpacity onPress={onBack}><Text style={styles.headerBtnText}>Back</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {!myPatient ? (
          <View style={styles.card}>
            <Text style={styles.modalTitle}>Track Your Token</Text>
            
            <Text style={styles.inputLabel}>Select Clinic & Doctor</Text>
            <TouchableOpacity 
              style={[styles.input, { justifyContent: 'center', backgroundColor: '#F9FAFB' }]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={{ color: selectedOption ? '#111827' : '#9CA3AF' }}>
                {selectedOption ? selectedOption.label : 'Tap to select...'}
              </Text>
            </TouchableOpacity>
            
            {dropdownOpen && clinicsWithDoctors.length > 0 && (
              <View style={{ maxHeight: 180, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 5, backgroundColor: '#fff', elevation: 2 }}>
                <ScrollView nestedScrollEnabled>
                  {clinicsWithDoctors.map((opt, i) => {
                    const isActive = selectedOption?.clinicId === opt.clinicId && selectedOption?.doctorId === opt.doctorId;
                    return (
                      <TouchableOpacity 
                        key={i} 
                        style={[styles.clinicSelectBtn, isActive && styles.clinicSelectBtnActive]}
                        onPress={() => {
                          setSelectedOption(opt);
                          setClinicId(opt.clinicId);
                          setDropdownOpen(false);
                        }}
                      >
                        {/* @ts-ignore - title works on web for tooltip */}
                        <Text title={opt.label} style={[styles.clinicSelectText, isActive && styles.clinicSelectTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            {dropdownOpen && clinicsWithDoctors.length === 0 && (
              <Text style={{ color: '#9CA3AF', marginBottom: 15 }}>Loading clinics and doctors...</Text>
            )}

            <Text style={styles.inputLabel}>Your Mobile Number</Text>
            <View style={[styles.input, { backgroundColor: '#F3F4F6', justifyContent: 'center' }]}>
              <Text style={{ color: '#4B5563', fontSize: 16 }}>{patientMobile || 'Not provided'}</Text>
            </View>

            <Text style={styles.inputLabel}>Your Token Number</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. T1" 
              value={searchToken} 
              onChangeText={setSearchToken} 
              autoCapitalize="characters"
            />
            
            <TouchableOpacity style={styles.primaryBtnModalFull} onPress={checkStatus} disabled={loading}>
              <Text style={styles.primaryBtnText}>{loading ? 'Checking...' : 'Check Status'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <TouchableOpacity style={{ alignSelf: 'flex-start', marginBottom: 15 }} onPress={() => setMyPatient(null)}>
              <Text style={{ color: '#0F766E', fontWeight: 'bold' }}>← Search Another</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.enrollSubtitle}>Clinic ID: {clinicId}</Text>
              <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#115E59' }}>{searchToken}</Text>
            </View>

            <View style={styles.divider} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
              <Text style={styles.inputLabel}>Current Status:</Text>
              <View style={[styles.statusBadge, styles[`status${myPatient.status}` as keyof typeof styles]]}>
                <Text style={[styles.statusText, styles[`statusText${myPatient.status}` as keyof typeof styles]]}>{myPatient.status}</Text>
              </View>
            </View>

            {myPatient.status === 'Waiting' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={styles.inputLabel}>People Ahead of You:</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#DC2626' }}>{myPatient.peopleAhead || 0}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
              <Text style={styles.inputLabel}>Next Visit / Note:</Text>
              <Text style={styles.patientName}>{myPatient.doctorNextVisit || 'N/A'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* CLINIC DASHBOARD SCREEN                                                    */
/* -------------------------------------------------------------------------- */
function DashboardScreen({ clinic, onReset }: { clinic: ClinicInfo, onReset: () => void }) {
  const [patients, setPatients] = useState<PatientToken[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Menus & Modals
  const [menuVisible, setMenuVisible] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // Settlement Data
  const [settlementInfo, setSettlementInfo] = useState<any>(null);

  // Forms
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientMobile, setNewPatientMobile] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDay, setSelectedDay] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('');
  
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');

  const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

  // Initial Fetch
  useEffect(() => {
    fetchQueue();
    fetchDoctors();
  }, []);

  const fetchQueue = async () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/clinics/${clinic.id}/tokens?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data = await res.json();
      if (Array.isArray(data)) setPatients(data);
    } catch (e) {
      console.warn('Fetch Queue Error', e);
      setPatients([
        { id: 'tok-1', tokenNumber: 'T1', patientName: 'John Doe', patientMobile: '9999999999', status: 'Waiting', scheduledTime: 'Today 10:00 AM' }
      ]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${BASE_URL}/clinics/${clinic.id}/doctors`);
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const data = await res.json();
      if (Array.isArray(data)) setDoctors(data);
    } catch (e) {
      console.warn('Fetch Doctors Error', e);
      setDoctors([
        { id: 'doc-1', name: 'Dr. Smith', specialization: 'General Physician' },
        { id: 'doc-2', name: 'Dr. Adams', specialization: 'Pediatrician' }
      ]);
    }
  };

  const handleAddDoctor = async () => {
    if (!newDocName.trim() || !newDocSpec.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/clinics/${clinic.id}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDocName, specialization: newDocSpec })
      });
      if (res.ok) {
        fetchDoctors(); // reload
        setDocModalVisible(false);
        setNewDocName(''); setNewDocSpec('');
        Alert.alert('Success', 'Doctor added');
      } else {
        // Fallback for UI if API is down
        const newDoc = { id: `doc-${Date.now()}`, name: newDocName, specialization: newDocSpec };
        setDoctors([...doctors, newDoc]);
        setDocModalVisible(false);
      }
    } catch (e) {
      // Fallback
      setDoctors([...doctors, { id: `doc-${Date.now()}`, name: newDocName, specialization: newDocSpec }]);
      setDocModalVisible(false);
      setNewDocName(''); setNewDocSpec('');
    }
  };

  const deleteDoctor = async (docId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/doctors/${docId}`, { method: 'DELETE' });
      if (res.ok) fetchDoctors();
      else throw new Error('Fallback');
    } catch (e) {
      setDoctors(doctors.filter(d => d.id !== docId));
    }
  };

  const issueToken = async () => {
    if (!newPatientName.trim() || !newPatientMobile.trim() || !selectedDocId || !selectedTime) return;
    
    const resetForm = () => {
      setNewPatientName('');
      setNewPatientMobile('');
      setSelectedDocId('');
      setSelectedTime('');
      setSelectedDay('Today');
    };

    try {
      const res = await fetch(`${BASE_URL}/clinics/${clinic.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: newPatientName,
          patientMobile: newPatientMobile,
          doctorId: selectedDocId,
          scheduledDay: selectedDay,
          scheduledTime: selectedTime
        })
      });
      if (res.ok) {
        fetchQueue();
        setIssueModalVisible(false);
        resetForm();
      } else {
        throw new Error('Fallback');
      }
    } catch (e) {
      const tokenNum = `${selectedDay}-T${patients.length + 1}`;
      setPatients([...patients, {
        id: `tok-${Date.now()}`, tokenNumber: tokenNum, patientName: newPatientName, 
        patientMobile: newPatientMobile, status: 'Waiting', doctorId: selectedDocId,
        scheduledTime: `${selectedDay} ${selectedTime}`
      }]);
      setIssueModalVisible(false);
      resetForm();
    }
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    try {
      await fetch(`${BASE_URL}/tokens/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchQueue();
    } catch (e) {}
    // Fallback UI update
    setPatients(patients.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const sendNotification = (patient: PatientToken) => {
    Alert.alert(
      'Notify Patient',
      `How do you want to notify ${patient.patientName}?`,
      [
        {
          text: 'WhatsApp',
          onPress: () => {
            const msg = `Hello ${patient.patientName}, your token ${patient.tokenNumber} at ${clinic.name} is approaching.`;
            Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}&phone=${patient.patientMobile}`);
          }
        },
        {
          text: 'SMS',
          onPress: () => {
            const msg = `Hello ${patient.patientName}, your token ${patient.tokenNumber} at ${clinic.name} is approaching.`;
            Linking.openURL(`sms:${patient.patientMobile}?body=${encodeURIComponent(msg)}`);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleOpenSettlement = async () => {
    setMenuVisible(false);
    setPaymentModalVisible(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/clinics/${clinic.id}/settlement?date=${date}`);
      if (!res.ok) throw new Error('Failed to fetch settlement');
      const data = await res.json();
      setSettlementInfo(data);
    } catch (e) {
      setSettlementInfo({
        totalDue: patients.length * 3,
        payment: {
          qrSvgUrl: `https://project--7b00890a-3832-46ed-a91b-f2c53975e112.lovable.app/api/public/v1/payments/qr?amount=${patients.length*3}`
        }
      });
    }
  };

  const handleSettlePayments = async () => {
    try {
      await fetch(`${BASE_URL}/clinics/${clinic.id}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: "UI-PAID" })
      });
      Alert.alert("Success", "Payment marked as completed!");
      setPaymentModalVisible(false);
    } catch (e) {
      Alert.alert("Success", "Payment marked as completed! (Fallback)");
      setPaymentModalVisible(false);
    }
  };

  const [queueFilter, setQueueFilter] = useState<'Today' | 'Tomorrow'>('Today');
  const filteredPatients = patients.filter(p => (p.scheduledDay || 'Today') === queueFilter);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          <Text style={styles.clinicUpi}>ID: {clinic.id}</Text>
        </View>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setMenuVisible(true)}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
      </View>

      {/* Hamburger Dropdown Menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setDocModalVisible(true); }}>
                <Text style={styles.menuItemText}>Manage Doctors</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleOpenSettlement}>
                <Text style={styles.menuItemText}>End of Day Settlement</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onReset(); }}>
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Doctor-wise Summary */}
      {doctors.length > 0 && (
        <View style={{ backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {doctors.map(doc => {
              const docPatients = filteredPatients.filter(p => p.doctorId === doc.id);
              const waiting = docPatients.filter(p => p.status === 'Waiting').length;
              const serving = docPatients.filter(p => p.status === 'Serving').length;
              const done = docPatients.filter(p => p.status === 'Done').length;
              return (
                <View key={doc.id} style={{ padding: 15, borderRightWidth: 1, borderColor: '#E5E7EB', minWidth: 130 }}>
                  <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 4 }} numberOfLines={1}>{doc.name}</Text>
                  <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>Total: {docPatients.length}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#D97706' }}>W: {waiting}</Text>
                    <Text style={{ fontSize: 12, color: '#2563EB' }}>S: {serving}</Text>
                    <Text style={{ fontSize: 12, color: '#059669' }}>D: {done}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.queueHeader}>
        <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setQueueFilter('Today')}>
            <Text style={[styles.sectionTitle, queueFilter !== 'Today' && { color: '#9CA3AF' }]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setQueueFilter('Tomorrow')}>
            <Text style={[styles.sectionTitle, queueFilter !== 'Tomorrow' && { color: '#9CA3AF' }]}>Tomorrow</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIssueModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Issue Token</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No patients in {queueFilter}'s queue yet.</Text>}
        renderItem={({ item }) => {
          const doctor = doctors.find(d => d.id === item.doctorId);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.tokenBadge}><Text style={styles.tokenText}>{item.tokenNumber}</Text></View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.patientDetails}>{item.scheduledTime || 'Walk-in'} • {doctor?.name || 'Dr.'}</Text>
                  <Text style={styles.patientDetails}>📞 {item.patientMobile}</Text>
                </View>
                <View style={[styles.statusBadge, styles[`status${item.status}` as keyof typeof styles]]}>
                  <Text style={[styles.statusText, styles[`statusText${item.status}` as keyof typeof styles]]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                {item.status === 'Waiting' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'Serving')}>
                    <Text style={styles.actionBtnText}>Serve</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'Serving' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'Done')}>
                    <Text style={styles.actionBtnText}>Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.outlineBtn} onPress={() => sendNotification(item)}>
                  <Text style={styles.outlineBtnText}>Notify</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Manage Doctors Modal */}
      <Modal visible={docModalVisible} animationType="slide" transparent onRequestClose={() => setDocModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Manage Doctors</Text>
            
            <ScrollView style={{ maxHeight: 200, marginBottom: 15 }} nestedScrollEnabled>
              {doctors.map(d => (
                <View key={d.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#F3F4F6' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold', color: '#111827' }}>{d.name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>{d.specialization || 'General'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteDoctor(d.id)} style={{ padding: 5 }}>
                    <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {doctors.length === 0 && <Text style={{ color: '#9CA3AF', padding: 10 }}>No doctors added yet.</Text>}
            </ScrollView>

            <Text style={[styles.modalTitle, { fontSize: 16, marginTop: 10 }]}>Add New Doctor</Text>
            <Text style={styles.inputLabel}>Doctor Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Dr. Adams" value={newDocName} onChangeText={setNewDocName} />
            <Text style={styles.inputLabel}>Specialization</Text>
            <TextInput style={styles.input} placeholder="e.g. Pediatrician" value={newDocSpec} onChangeText={setNewDocSpec} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setDocModalVisible(false); setNewDocName(''); setNewDocSpec(''); }}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnModal} onPress={handleAddDoctor}><Text style={styles.primaryBtnText}>Add Doctor</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Issue Token Modal */}
      <Modal visible={issueModalVisible} animationType="slide" transparent onRequestClose={() => setIssueModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Issue New Token</Text>
              
              <Text style={styles.inputLabel}>Patient Name</Text>
              <TextInput style={styles.input} placeholder="Enter name" value={newPatientName} onChangeText={setNewPatientName} />
              
              <Text style={styles.inputLabel}>Patient Mobile</Text>
              <TextInput style={styles.input} placeholder="Mobile Number" value={newPatientMobile} onChangeText={setNewPatientMobile} keyboardType="phone-pad" />
              
              <Text style={styles.inputLabel}>Select Day</Text>
              <View style={{ flexDirection: 'row', marginBottom: 20, gap: 10 }}>
                <TouchableOpacity style={[styles.dayChip, selectedDay === 'Today' && styles.dayChipActive]} onPress={() => setSelectedDay('Today')}>
                  <Text style={[styles.dayChipText, selectedDay === 'Today' && styles.dayChipTextActive]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dayChip, selectedDay === 'Tomorrow' && styles.dayChipActive]} onPress={() => setSelectedDay('Tomorrow')}>
                  <Text style={[styles.dayChipText, selectedDay === 'Tomorrow' && styles.dayChipTextActive]}>Tomorrow</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Select Time Slot</Text>
              <ScrollView style={styles.timeSelector} horizontal showsHorizontalScrollIndicator={false}>
                {TIME_SLOTS.map(time => (
                  <TouchableOpacity 
                    key={time} 
                    style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeChipText, selectedTime === time && styles.timeChipTextActive]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.inputLabel}>Assign Doctor</Text>
              <ScrollView style={styles.doctorSelector} horizontal showsHorizontalScrollIndicator={false}>
                {doctors.map(doc => (
                  <TouchableOpacity 
                    key={doc.id} 
                    style={[styles.doctorChip, selectedDocId === doc.id && styles.doctorChipActive]}
                    onPress={() => setSelectedDocId(doc.id)}
                  >
                    <Text style={[styles.doctorChipText, selectedDocId === doc.id && styles.doctorChipTextActive]}>{doc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIssueModalVisible(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnModal} onPress={issueToken}><Text style={styles.primaryBtnText}>Issue Token</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EOD Settlement Modal */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalContainerCenter}>
          <View style={styles.modalContentCenter}>
            <Text style={styles.modalTitle}>End of Day Settlement</Text>
            
            <View style={styles.paymentSummaryBox}>
              <Text style={styles.paymentTotalText}>Amount Due: ₹{settlementInfo?.totalDue !== undefined ? settlementInfo.totalDue : (patients.length * 3)}</Text>
              <Text style={styles.paymentSummaryText}>Scan the QR below to pay the platform.</Text>
            </View>
            
            <View style={styles.qrPlaceholder}>
               {settlementInfo?.payment?.qrSvgUrl ? (
                 <Image 
                   source={{ uri: settlementInfo.payment.qrSvgUrl }} 
                   style={{ width: 250, height: 250 }} 
                   resizeMode="contain"
                 />
               ) : (
                 <Text style={styles.qrText}>Pay to: 9663884465</Text>
               )}
            </View>

            <TouchableOpacity style={styles.primaryBtnModalFull} onPress={handleSettlePayments}>
              <Text style={styles.primaryBtnText}>Confirm Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, {width: '100%', marginTop: 10}]} onPress={() => setPaymentModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN APP COMPONENT                                                         */
/* -------------------------------------------------------------------------- */
export default function App() {
  const [role, setRole] = useState<'none' | 'clinic' | 'patient'>('none');
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [patientMobile, setPatientMobile] = useState('');
  
  if (role === 'none') {
    return <AuthScreen onLogin={(selectedRole, clinicData, mobile) => {
      setRole(selectedRole);
      if (clinicData) setClinic(clinicData);
      if (mobile) setPatientMobile(mobile);
    }} />;
  }

  if (role === 'patient') {
    return <PatientScreen activeClinicId={clinic?.id || null} patientMobile={patientMobile} onBack={() => { setRole('none'); setPatientMobile(''); }} />;
  }

  if (role === 'clinic') {
    // If they logged in as clinic but we don't have clinic info, fallback
    if (!clinic) return <AuthScreen onLogin={(r, c) => { setRole(r); if(c) setClinic(c); }} />;
    return <DashboardScreen clinic={clinic} onReset={() => { setClinic(null); setRole('none'); }} />;
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  // Auth Styles
  authContainer: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  authBrand: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 20 },
  authCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 25, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#E5E7EB' },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  authSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 25 },
  authSubmitBtn: { backgroundColor: '#111827', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  authSubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  authFooter: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  authFooterText: { color: '#6B7280', fontSize: 14 },
  authFooterLink: { color: '#111827', fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#111827' },
  toggleBtnText: { color: '#4B5563', fontWeight: '500' },
  toggleBtnTextActive: { color: '#FFF', fontWeight: '500' },
  clinicSelectBtn: { padding: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 8 },
  clinicSelectBtnActive: { backgroundColor: '#CCFBF1', borderColor: '#0F766E' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mainBrand: { fontSize: 42, fontWeight: '900', color: '#115E59', marginBottom: 10 },
  subBrand: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 30 },
  roleBtnClinic: { backgroundColor: '#0F766E', paddingVertical: 18, width: '100%', borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  roleBtnClinicText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  roleBtnPatient: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#0F766E', paddingVertical: 18, width: '100%', borderRadius: 12, alignItems: 'center' },
  roleBtnPatientText: { color: '#0F766E', fontSize: 18, fontWeight: 'bold' },
  enrollContainer: { padding: 25, flexGrow: 1, justifyContent: 'center' },
  enrollHeader: { marginBottom: 30 },
  enrollTitle: { fontSize: 28, fontWeight: 'bold', color: '#115E59' },
  enrollSubtitle: { fontSize: 16, color: '#6B7280', marginTop: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#E5E7EB', zIndex: 10 },
  clinicName: { fontSize: 20, fontWeight: 'bold', color: '#115E59' },
  clinicUpi: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  hamburgerBtn: { padding: 10, gap: 5 },
  hamburgerLine: { width: 24, height: 2.5, backgroundColor: '#115E59', borderRadius: 2 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  dropdownMenu: { position: 'absolute', top: 60, right: 20, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, minWidth: 180, zIndex: 20 },
  menuItem: { paddingVertical: 15, paddingHorizontal: 20 },
  menuItemText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6' },
  headerBtnText: { color: '#EF4444', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', padding: 20, gap: 15 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  addBtn: { backgroundColor: '#0F766E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 15 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 30, fontSize: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  tokenBadge: { backgroundColor: '#CCFBF1', minWidth: 50, paddingHorizontal: 10, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  tokenText: { fontSize: 14, fontWeight: 'bold', color: '#0F766E' },
  patientInfo: { flex: 1, marginLeft: 15 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  patientDetails: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusWaiting: { backgroundColor: '#FEF3C7' },
  statusTextWaiting: { color: '#B45309' },
  statusServing: { backgroundColor: '#DCFCE7' },
  statusTextServing: { color: '#15803D' },
  statusDone: { backgroundColor: '#E5E7EB' },
  statusTextDone: { color: '#4B5563' },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 15, alignItems: 'center' },
  actionBtn: { flex: 1, backgroundColor: '#0F766E', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: '600' },
  outlineBtn: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#0F766E', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  outlineBtnText: { color: '#0F766E', fontWeight: '600' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, maxHeight: '80%' },
  modalContainerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContentCenter: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, width: '100%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  doctorSelector: { flexDirection: 'row', marginBottom: 30 },
  doctorChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginRight: 10, height: 60, justifyContent: 'center' },
  doctorChipActive: { backgroundColor: '#CCFBF1', borderColor: '#0F766E' },
  doctorChipText: { color: '#4B5563', fontWeight: '600', fontSize: 15 },
  doctorChipTextActive: { color: '#0F766E' },
  dayChip: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  dayChipActive: { backgroundColor: '#CCFBF1', borderColor: '#0F766E' },
  dayChipText: { color: '#4B5563', fontWeight: '600', fontSize: 14 },
  dayChipTextActive: { color: '#0F766E' },
  timeSelector: { flexDirection: 'row', marginBottom: 20 },
  timeChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', marginRight: 10 },
  timeChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  timeChipText: { color: '#4B5563', fontWeight: '600', fontSize: 14 },
  timeChipTextActive: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 15, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 8, alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#4B5563', fontWeight: '600', fontSize: 16 },
  primaryBtn: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', backgroundColor: '#0F766E', marginTop: 10 },
  primaryBtnModal: { flex: 1, paddingVertical: 15, borderRadius: 8, alignItems: 'center', backgroundColor: '#0F766E' },
  primaryBtnModalFull: { width: '100%', paddingVertical: 15, borderRadius: 8, alignItems: 'center', backgroundColor: '#0F766E' },
  primaryBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  paymentSummaryBox: { width: '100%', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  paymentSummaryText: { fontSize: 16, color: '#4B5563', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  paymentTotalText: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  qrPlaceholder: { padding: 20, backgroundColor: '#F9FAFB', borderRadius: 15, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', marginBottom: 20, width: 220 },
  qrText: { fontSize: 14, fontWeight: '600', color: '#4B5563', textAlign: 'center' }
});
